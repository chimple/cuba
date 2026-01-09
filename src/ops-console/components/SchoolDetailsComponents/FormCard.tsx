import React, { useEffect, useState } from "react";
import "./FormCard.css";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { t } from "i18next";
import CheckIcon from "@mui/icons-material/Check";

export type FieldKind = "text" | "email" | "phone" | "select";
export type FieldColumn = 0 | 1 | 2; // 0 = left, 1 = right, 2 = full row

export interface FieldConfig {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  column?: FieldColumn;
  multi?: boolean;
  disabled?: boolean;
}

export type MessageType = "error" | "warning" | "info" | "success";

export interface MessageConfig {
  text: string;
  type?: MessageType;
}

interface EntityModalProps {
  open: boolean;
  title: string;
  submitLabel: string;
  fields: FieldConfig[];
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
  message?: MessageConfig | string;
  initialValues?: Record<string, string>;
  disabled?: boolean; 
}

const FormCard: React.FC<EntityModalProps> = ({
  open,
  title,
  submitLabel,
  fields,
  onClose,
  onSubmit,
  message,
  initialValues,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  useEffect(() => {
  if (!open) return;

  const init: Record<string, string> = {};

  fields.forEach((f) => {
    init[f.name] = initialValues?.[f.name] ?? "";
  });

  setValues(init);
  setOpenSelect(null);
}, [open, fields, initialValues]);


  if (!open) return null;

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const renderFieldInput = (field: FieldConfig) => {
    const commonInputProps = {
      id: field.name,
      name: field.name,
      value: values[field.name] ?? "",
      required: field.required,
      placeholder: field.placeholder,
    };

    switch (field.kind) {
      case "select":
        const isThisSelectOpen = openSelect === field.name;

        if (field.multi) {
          const currentVal = values[field.name] || "";
          const selectedIds = currentVal
            ? currentVal.split(",").filter(Boolean)
            : [];
          const displayText = selectedIds
            .map((id) => {
              const opt = field.options?.find((o) => o.value === id);
              return opt ? t(opt.label) : id;
            })
            .join(", ");

          return (
            <div
              className={`formcard-select-wrapper ${
                isThisSelectOpen ? "formcard-select-open" : ""
              }`}
            >
              <input
                className="formcard-placeholder-validator"
                value={values[field.name] || ""}
                required={field.required}
                onChange={() => {}}
                tabIndex={-1}
              />

              <div
                className="formcard-multiselect-trigger"
                onClick={() =>
                  setOpenSelect(isThisSelectOpen ? null : field.name)
                }
                tabIndex={0}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setOpenSelect(null);
                  }
                }}
              >
                {displayText ? (
                  <span
                    className="formcard-multiselect-trigger-text"
                    title={displayText}
                  >
                    {displayText}
                  </span>
                ) : (
                  <span className="formcard-multiselect-trigger-text formcard-multiselect-trigger-placeholder">
                    {field.placeholder
                      ? t(field.placeholder)
                      : `${t("Select ")} ${t(field.label)}`}
                  </span>
                )}
                <span className="formcard-select-arrow-flipper">
                  <span className="formcard-arrow-down">▾</span>
                  <span className="formcard-arrow-up">▴</span>
                </span>
              </div>
              {isThisSelectOpen && (
                <div className="formcard-multiselect-dropdown">
                  {field.options?.map((opt) => {
                    const isSelected = selectedIds.includes(opt.value);
                    return (
                      <div
                        key={opt.value}
                        className={`formcard-multiselect-option ${
                          isSelected ? "selected" : ""
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const newSelected = isSelected
                            ? selectedIds.filter((id) => id !== opt.value)
                            : [...selectedIds, opt.value];
                          handleChange(field.name, newSelected.join(","));
                        }}
                      >
                        <div className="formcard-multiselect-checkbox">
                          {isSelected && (
                            <CheckIcon
                              style={{ fontSize: 12, color: "white" }}
                            />
                          )}
                        </div>
                        {t(opt.label)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const shouldUseCustomDropdown = (field.options?.length || 0) > 3;

        if (shouldUseCustomDropdown) {
          const currentValue = values[field.name] || "";
          const selectedOption = field.options?.find(
            (o) => o.value === currentValue
          );
          const displayText = selectedOption ? t(selectedOption.label) : "";

          return (
            <div
              className={`formcard-select-wrapper ${
                isThisSelectOpen ? "formcard-select-open" : ""
              }`}
            >
              <input
                className="formcard-placeholder-validator"
                value={values[field.name] || ""}
                required={field.required}
                onChange={() => {}}
                tabIndex={-1}
                onInvalid={(e) => {
                  (e.target as HTMLInputElement).focus();
                }}
              />

              <div
                className="formcard-multiselect-trigger"
                onClick={() =>
                  setOpenSelect(isThisSelectOpen ? null : field.name)
                }
                tabIndex={0}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setOpenSelect(null);
                  }
                }}
              >
                {displayText ? (
                  <span
                    className="formcard-multiselect-trigger-text"
                    title={displayText}
                  >
                    {displayText}
                  </span>
                ) : (
                  <span className="formcard-multiselect-trigger-text formcard-multiselect-trigger-placeholder">
                    {field.placeholder
                      ? t(field.placeholder)
                      : `${t("Select ")} ${t(field.label)}`}
                  </span>
                )}
                <span className="formcard-select-arrow-flipper">
                  <span className="formcard-arrow-down">▾</span>
                  <span className="formcard-arrow-up">▴</span>
                </span>
              </div>
              {isThisSelectOpen && (
                <div className="formcard-multiselect-dropdown">
                  {field.options?.map((opt) => {
                    const isSelected = currentValue === opt.value;
                    return (
                      <div
                        key={opt.value}
                        className={`formcard-multiselect-option ${
                          isSelected ? "selected" : ""
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleChange(field.name, opt.value);
                          setOpenSelect(null);
                        }}
                      >
                        {t(opt.label)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <div
            className={`formcard-select-wrapper ${
              isThisSelectOpen ? "formcard-select-open" : ""
            }`}
          >
            <select
              {...commonInputProps}
              disabled={field.disabled}
              onMouseDown={() => {
                setOpenSelect(isThisSelectOpen ? null : field.name);
              }}
              onChange={(e) => {
                handleChange(field.name, e.target.value);
                setOpenSelect(null);
              }}
              onBlur={() => {
                setOpenSelect(null);
              }}
            >
              <option value="">
                {field.placeholder
                  ? t(field.placeholder)
                  : `${t("Select ")} ${t(field.label)}`}
              </option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </option>
              ))}
            </select>
            <span className="formcard-select-arrow-flipper">
              <span className="formcard-arrow-down">▾</span>
              <span className="formcard-arrow-up">▴</span>
            </span>
          </div>
        );

      case "phone":
        return (
          <PhoneInput
            defaultCountry="in"
            value={values[field.name] ?? ""}
            onChange={(value) => handleChange(field.name, value)}
            disabled={field.disabled}
            disableCountryGuess
            className="formcard-phone-input"
            inputClassName="formcard-phone-input-inner"
            inputProps={{
              id: field.name,
              name: field.name,
              required: field.required,
              placeholder: field.placeholder ?? "",
              onKeyDown: (e) => {
                const input = e.currentTarget as HTMLInputElement;
                const selectionStart = input.selectionStart ?? 0;
                const prefixMatch = input.value.match(/^\+\d+\s*/);
                const prefixLength = prefixMatch ? prefixMatch[0].length : 0;
                if (
                  selectionStart <= prefixLength &&
                  (e.key === "Backspace" || e.key === "Delete")
                ) {
                  e.preventDefault();
                }
              },
            }}
          />
        );

      case "email":
        return (
          <input
            type="email"
            {...commonInputProps}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );

      case "text":
      default:
        return (
          <input
            type="text"
            {...commonInputProps}
            disabled={field.disabled}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );
    }
  };

  const getFieldClassName = (field: FieldConfig) => {
    const col = field.column ?? 2;
    if (col === 0) return "formcard-form-group formcard-col-left";
    if (col === 1) return "formcard-form-group formcard-col-right";
    return "formcard-form-group formcard-col-full";
  };

  const renderMessage = () => {
    if (!message) return null;

    const messageConfig: MessageConfig =
      typeof message === "string" ? { text: message, type: "info" } : message;

    const messageType = messageConfig.type || "info";

    return (
      <div className={`formcard-message formcard-message-${messageType}`}>
        {t(messageConfig.text)}
      </div>
    );
  };

  return (
    <div className="formcard-modal-backdrop">
      <div className="formcard-modal">
        <div className="formcard-modal-header">
          <h2 className="formcard-title">{title}</h2>
          <button
            type="button"
            className="formcard-close-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="formcard-modal-body">
          <div className="formcard-form-grid">
            {fields.map((field) => (
              <div key={field.name} className={getFieldClassName(field)}>
                <label htmlFor={field.name} className="formcard-label">
                  {t(field.label)}
                  {field.required && (
                    <span className="formcard-required"> *</span>
                  )}
                </label>
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
          {renderMessage()}
          <div className="formcard-modal-footer">
            <button
              type="button"
              className="formcard-btn formcard-btn-text"
              onClick={onClose}
            >
              {t("Cancel")}
            </button>
            <button type="submit" className="formcard-btn formcard-btn-primary">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormCard;
