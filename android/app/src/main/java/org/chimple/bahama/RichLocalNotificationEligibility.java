package org.chimple.bahama;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Checks cached GrowthBook rules against completed lessons in the local SQLite database. */
final class RichLocalNotificationEligibility {
    private static final String DATABASE_NAME = "db_issue10SQLite.db";
    private static final String DELIVERY_HISTORY = "rich_local_notification_delivery";

    private RichLocalNotificationEligibility() { }

    static boolean shouldShow(Context context, JSONObject payload, long scheduledAt) {
        if (!"daily_reward_local".equals(payload.optString("notificationType"))) return true;
        JSONObject guard = payload.optJSONObject("guard");
        String studentId = payload.optString("target_student_id");
        if (guard == null || studentId.isEmpty()) return false;
        List<LocalDate> activity = readActivity(context, studentId, guard.optJSONArray("activity_sources"));
        if (activity == null) return false;
        LocalDate date = Instant.ofEpochMilli(scheduledAt).atZone(ZoneId.systemDefault()).toLocalDate();
        return matchesRule(payload.optString("campaign_id"), guard, date, activity);
    }

    static JSONObject selectVariant(Context context, JSONObject payload) {
        JSONObject guard = payload.optJSONObject("guard");
        if (guard == null) return new JSONObject();
        int cooldownDays = Math.max(0, guard.optInt("cooldown_days", 0));
        JSONArray variants = guard.optJSONArray("variants");
        if (variants == null) {
            return outsideCooldown(context, guard.optString("template_id"), cooldownDays)
                    ? new JSONObject() : null;
        }
        int totalWeight = 0;
        for (int index = 0; index < variants.length(); index++) {
            JSONObject variant = variants.optJSONObject(index);
            if (variant == null || !outsideCooldown(context,
                    variant.optString("template_id"), cooldownDays)) continue;
            totalWeight += Math.max(1, variant.optInt("weight", 1));
        }
        if (totalWeight == 0) return null;
        int cursor = (int) (Math.random() * totalWeight);
        for (int index = 0; index < variants.length(); index++) {
            JSONObject variant = variants.optJSONObject(index);
            if (variant == null || !outsideCooldown(context,
                    variant.optString("template_id"), cooldownDays)) continue;
            cursor -= Math.max(1, variant.optInt("weight", 1));
            if (cursor < 0) return variant;
        }
        return null;
    }

    private static boolean outsideCooldown(Context context, String templateId, int cooldownDays) {
        if (templateId.isEmpty() || cooldownDays == 0) return true;
        long lastSent = context.getSharedPreferences(DELIVERY_HISTORY, Context.MODE_PRIVATE)
                .getLong(templateId, 0);
        return lastSent == 0 || System.currentTimeMillis() - lastSent >= cooldownDays * 86_400_000L;
    }

    static void markShown(Context context, JSONObject payload, JSONObject variant) {
        JSONObject guard = payload.optJSONObject("guard");
        if (guard == null) return;
        String templateId = variant.optString("template_id", guard.optString("template_id"));
        if (!templateId.isEmpty()) {
            context.getSharedPreferences(DELIVERY_HISTORY, Context.MODE_PRIVATE)
                    .edit().putLong(templateId, System.currentTimeMillis()).commit();
        }
    }

    private static List<LocalDate> readActivity(Context context, String studentId, JSONArray sources) {
        File file = context.getDatabasePath(DATABASE_NAME);
        if (!file.isFile()) return null;
        List<LocalDate> dates = new ArrayList<>();
        try (SQLiteDatabase database = SQLiteDatabase.openDatabase(
                file.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
             Cursor cursor = database.rawQuery(
                     "SELECT created_at, source FROM result " +
                             "WHERE student_id = ? AND status = 'completed' " +
                             "AND (is_deleted = 0 OR is_deleted IS NULL)",
                     new String[]{studentId})) {
            while (cursor.moveToNext()) {
                if (!matchesSource(cursor.getString(1), sources)) continue;
                LocalDate date = parseDate(cursor.getString(0));
                if (date != null) dates.add(date);
            }
            return dates;
        } catch (Exception ignored) {
            // The database may be unavailable during an import or migration. Fail closed.
            return null;
        }
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isEmpty()) return null;
        try {
            return OffsetDateTime.parse(value).atZoneSameInstant(ZoneId.systemDefault()).toLocalDate();
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(value).atZone(ZoneId.systemDefault()).toLocalDate();
            } catch (Exception invalidDate) {
                return null;
            }
        }
    }

    private static boolean matchesSource(String source, JSONArray configured) {
        if (configured == null || configured.length() == 0) {
            return "learning_pathway_home_no_pal".equals(source)
                    || "learning_pathway_home_pal".equals(source)
                    || "learning_pathway_homework".equals(source);
        }
        for (int index = 0; index < configured.length(); index++) {
            switch (configured.optString(index)) {
                case "all": return true;
                case "home_pathway":
                    if ("learning_pathway_home_no_pal".equals(source)
                            || "learning_pathway_home_pal".equals(source)) return true;
                    break;
                case "homework_pathway":
                    if ("learning_pathway_homework".equals(source)) return true;
                    break;
                case "subject_page":
                    if ("subject_page".equals(source)) return true;
                    break;
                case "live_quiz":
                    if ("live_quiz_room".equals(source)) return true;
                    break;
                case "initial_assessment":
                    if ("initial_assessment".equals(source)) return true;
                    break;
                default: break;
            }
        }
        return false;
    }

    private static boolean matchesRule(String campaignId, JSONObject guard,
                                       LocalDate date, List<LocalDate> activity) {
        JSONObject trigger = guard.optJSONObject("trigger");
        if (trigger != null) {
            JSONArray conditions = trigger.optJSONArray("conditions");
            if (conditions == null || conditions.length() == 0) return false;
            boolean any = "any".equals(trigger.optString("match", "all"));
            for (int index = 0; index < conditions.length(); index++) {
                boolean matched = matchesCondition(conditions.optJSONObject(index), date, activity);
                if (any && matched) return true;
                if (!any && !matched) return false;
            }
            return !any;
        }
        JSONObject eligibility = guard.optJSONObject("eligibility");
        String activityType = eligibility == null
                ? ("morning_played".equals(campaignId) ? "played" : "not_played")
                : eligibility.optString("activity");
        String relativeDay = eligibility == null
                ? (("morning_played".equals(campaignId) || "morning_missed".equals(campaignId))
                        ? "previous_day" : "same_day")
                : eligibility.optString("relative_day");
        LocalDate reference = "previous_day".equals(relativeDay) ? date.minusDays(1) : date;
        boolean played = activity.contains(reference);
        return "played".equals(activityType) ? played : "not_played".equals(activityType) && !played;
    }

    private static boolean matchesCondition(JSONObject condition, LocalDate date,
                                            List<LocalDate> activity) {
        if (condition == null) return false;
        Set<LocalDate> distinct = new HashSet<>(activity);
        String type = condition.optString("type");
        switch (type) {
            case "played":
            case "not_played": {
                String day = condition.optString("day");
                if (!"today".equals(day) && !"yesterday".equals(day)) return false;
                boolean played = distinct.contains("yesterday".equals(day) ? date.minusDays(1) : date);
                return "played".equals(type) ? played : !played;
            }
            case "inactive_for_days": {
                int days = positiveInteger(condition, "days", false);
                return days > 0 && inactiveDays(distinct, date) >= days;
            }
            case "played_streak": {
                int days = positiveInteger(condition, "days", false);
                String ending = condition.optString("ending");
                if (days < 1 || (!"today".equals(ending) && !"yesterday".equals(ending))) return false;
                LocalDate end = "yesterday".equals(ending) ? date.minusDays(1) : date;
                return countWindow(new ArrayList<>(distinct), end, days) == days;
            }
            case "played_days_ago": {
                int days = positiveInteger(condition, "days", true);
                return days >= 0 && distinct.contains(date.minusDays(days));
            }
            case "": break;
            default: return false;
        }
        Object expectedValue = condition.opt("value");
        if (!(expectedValue instanceof Number)) return false;
        double expected = ((Number) expectedValue).doubleValue();
        if (!Double.isFinite(expected)) return false;
        LocalDate reference = date.plusDays(condition.optInt("relative_days", 0));
        int window = Math.max(1, condition.optInt("window_days", 1));
        long actual;
        switch (condition.optString("metric")) {
            case "inactive_days": actual = inactiveDays(distinct, reference); break;
            case "active_days": actual = countWindow(new ArrayList<>(distinct), reference, window); break;
            case "activity_count":
                actual = condition.optDouble("window_days", 0) != 0
                        ? countWindow(activity, reference, window) : activity.size();
                break;
            default: return false;
        }
        switch (condition.optString("operator")) {
            case "eq": return actual == expected;
            case "neq": return actual != expected;
            case "gt": return actual > expected;
            case "gte": return actual >= expected;
            case "lt": return actual < expected;
            case "lte": return actual <= expected;
            default: return false;
        }
    }

    private static int positiveInteger(JSONObject value, String key, boolean allowZero) {
        Object raw = value.opt(key);
        if (!(raw instanceof Number)) return -1;
        double number = ((Number) raw).doubleValue();
        if (!Double.isFinite(number) || number != Math.floor(number)
                || number < (allowZero ? 0 : 1) || number > Integer.MAX_VALUE) return -1;
        return (int) number;
    }

    private static long inactiveDays(Set<LocalDate> dates, LocalDate date) {
        LocalDate latest = null;
        for (LocalDate played : dates) {
            if (latest == null || played.isAfter(latest)) latest = played;
        }
        return latest == null ? 9_007_199_254_740_991L : Math.max(0, ChronoUnit.DAYS.between(latest, date));
    }

    private static long countWindow(List<LocalDate> dates, LocalDate end, int days) {
        LocalDate start = end.minusDays(days - 1L);
        return dates.stream().filter(played -> !played.isBefore(start) && !played.isAfter(end)).count();
    }
}
