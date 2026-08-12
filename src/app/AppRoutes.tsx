import { Route, Switch } from 'react-router-dom';
import { PAGES } from '../common/constants';
import ProtectedRoute from '../ProtectedRoute';
import Home from '../pages/Home';
import { End } from '../pages/End';
import Profile from '../pages/Profile';
import Parent from '../pages/Parent';
import DisplayStudents from '../pages/DisplayStudents';
import DisplaySubjects from '../pages/DisplaySubjects';
import AddCourses from '../pages/AddCourses';
import StudentProgress from '../pages/StudentProgress';
import SearchLesson from '../pages/SearchLesson';
import Leaderboard from '../pages/Leaderboard';
import SelectMode from '../pages/SelectMode';
import HotUpdate from '../pages/HotUpdate';
import TermsAndConditions from '../pages/TermsAndConditions';
import DisplayChapters from '../pages/DisplayChapters';
import LiveQuizRoom from '../pages/LiveQuizRoom';
import LiveQuizGame from '../pages/LiveQuizGame';
import LiveQuizRoomResult from '../pages/LiveQuizRoomResult';
import LiveQuizLeaderBoard from '../pages/LiveQuizLeaderBoard';
import LidoPlayer from '../pages/LidoPlayer';
import UploadPage from '../ops-console/pages/UploadPage';
import SidebarPage from '../ops-console/pages/SidebarPage';
import ResetPassword from '../pages/ResetPassword';
import DisplayClasses from '../teachers-module/pages/DisplayClasses';
import LessonDetails from '../teachers-module/pages/LessonDetails';
import ShowStudentsInAssignmentPage from '../teachers-module/pages/ShowStudentsInAssignmentPage';
import ReqEditSchool from '../teachers-module/pages/ReqEditSchool';
import StudentProfile from '../teachers-module/pages/StudentProfile';
import AddStudent from '../teachers-module/pages/AddStudent';
import UserProfile from '../teachers-module/pages/UserProfile';
import SubjectSelection from '../teachers-module/pages/SubjectSelection';
import DisplaySchools from '../teachers-module/pages/DisplaySchools';
import StudentReport from '../teachers-module/pages/StudentReport';
import ManageSchools from '../teachers-module/pages/ManageSchools';
import SchoolProfile from '../teachers-module/pages/SchoolProfile';
import ManageClass from '../teachers-module/pages/ManageClass';
import DashBoardDetails from '../teachers-module/pages/DashBoardDetails';
import EditClass from '../teachers-module/pages/EditClass';
import ClassProfile from '../teachers-module/pages/ClassProfile';
import ShowChapters from '../teachers-module/pages/ShowChapters';
import SearchLessons from '../teachers-module/pages/SearchLessons';
import HomePage from '../teachers-module/pages/HomePage';
import TeacherLibraryAssignments from '../teachers-module/pages/TeacherLibraryAssignments';
import ClassUsers from '../teachers-module/pages/ClassUsers';
import AddTeacher from '../teachers-module/pages/AddTeacher';
import TeacherProfile from '../teachers-module/pages/TeacherProfile';
import SchoolUsers from '../teachers-module/pages/SchoolUsers';
import AddSchoolUser from '../teachers-module/pages/AddSchoolUser';
import ProgramsPage from '../ops-console/pages/ProgramPage';
import SchoolList from '../ops-console/pages/SchoolList';
import LoginScreen from '../pages/LoginScreen';
import ProfileDetails from '../components/profileDetails/ProfileDetails';
import RequestList from '../ops-console/pages/RequestList';
import AddTeacherName from '../teachers-module/pages/AddTeacherName';
import SearchSchool from '../teachers-module/pages/SearchSchool';
import JoinSchool from '../pages/JoinSchool';
import CreateSchool from '../teachers-module/pages/CreateSchool';
import ScanRedirect from '../teachers-module/components/homePage/assignment/ScanRedirect';
import ColoringBoard from '../components/coloring/ColoringBoard';
import PostSuccess from '../teachers-module/pages/PostSuccess';
import QRAssignments from '../teachers-module/components/homePage/assignment/QRAssignments';
import TeacherRecommendedAssignments from '../teachers-module/components/homePage/assignment/TeacherRecommendedAssignments';
import StreakPage from '../teachers-module/components/streakComponent/streakPage';
import StickerBook from '../pages/StickerBook';
import KidsAppLocation from '../teachers-module/pages/KidsAppLocation';

const AppRoutes = () => (
  <Switch>
    <Route path={PAGES.ROOT} exact={true}>
      <HotUpdate />
    </Route>
    <Route path={PAGES.APP_UPDATE} exact={true}>
      <HotUpdate />
    </Route>
    <Route path={PAGES.RESET_PASSWORD} exact={true}>
      <ResetPassword />
    </Route>
    <ProtectedRoute path={PAGES.HOME} exact={true}>
      <Home />
    </ProtectedRoute>
    <Route path={PAGES.LOGIN} exact={true}>
      <LoginScreen />
    </Route>
    <ProtectedRoute path={PAGES.LIDO_PLAYER} exact={true}>
      <LidoPlayer />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.END} exact={true}>
      <End />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.PROFILE} exact={true}>
      <Profile />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.PARENT} exact={true}>
      <Parent />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.QR_ASSIGNMENTS} exact={true}>
      <QRAssignments />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.CREATE_STUDENT} exact={true}>
      <ProfileDetails />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.EDIT_STUDENT} exact={true}>
      <ProfileDetails />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.DISPLAY_STUDENT} exact={true}>
      <DisplayStudents />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.DISPLAY_SUBJECTS} exact={true}>
      <DisplaySubjects />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.ADD_SUBJECTS} exact={true}>
      <AddCourses />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.DISPLAY_CHAPTERS} exact={true}>
      <DisplayChapters />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.STUDENT_PROGRESS} exact={true}>
      <StudentProgress />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SEARCH} exact={true}>
      <SearchLesson />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.LEADERBOARD} exact={true}>
      <Leaderboard />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.ASSIGNMENT} exact={true}>
      <Home />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.LIVE_QUIZ} exact={true}>
      <Home />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.JOIN_CLASS} exact={true}>
      <Home />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.JOIN_SCHOOL} exact={true}>
      <JoinSchool />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.CREATE_SCHOOL} exact={true}>
      <CreateSchool />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SELECT_MODE} exact={true}>
      <SelectMode />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.STUDENT_PROFILE} exact={true}>
      <StudentProfile />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.ADD_STUDENT} exact={true}>
      <AddStudent />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.USER_PROFILE} exact={true}>
      <UserProfile />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.ADD_TEACHER_NAME} exact={true}>
      <AddTeacherName />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SUBJECTS_PAGE} exact={true}>
      <SubjectSelection />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.LIVE_QUIZ_JOIN} exact={true}>
      <LiveQuizRoom />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.LIVE_QUIZ_GAME} exact={true}>
      <LiveQuizGame />
    </ProtectedRoute>
    <Route path={PAGES.TERMS_AND_CONDITIONS} exact={true}>
      <TermsAndConditions />
    </Route>
    <ProtectedRoute path={PAGES.LIVE_QUIZ_ROOM_RESULT} exact={true}>
      <LiveQuizRoomResult />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.LIVE_QUIZ_LEADERBOARD} exact={true}>
      <LiveQuizLeaderBoard />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.DISPLAY_SCHOOLS} exact={true}>
      <DisplaySchools />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.KIDS_APP_LOCATION} exact={true}>
      <KidsAppLocation />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SEARCH_SCHOOL} exact={true}>
      <SearchSchool />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.STUDENT_REPORT} exact={true}>
      <StudentReport />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.DISPLAY_CLASSES} exact={true}>
      <DisplayClasses />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.MANAGE_SCHOOL} exact={true}>
      <ManageSchools />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SCHOOL_PROFILE} exact={true}>
      <SchoolProfile />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.COLORING_BOARD} exact={true}>
      <ColoringBoard />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.STICKER_BOOK} exact={true}>
      <StickerBook />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.REQ_ADD_SCHOOL} exact={true}>
      <ReqEditSchool />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SCAN_REDIRECT}>
      <ScanRedirect />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.MANAGE_CLASS} exact={true}>
      <ManageClass />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.REQ_EDIT_SCHOOL} exact={true}>
      <ReqEditSchool />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.DASHBOARD_DETAILS} exact={true}>
      <DashBoardDetails />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.ADD_CLASS} exact={true}>
      <EditClass />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.CLASS_PROFILE} exact={true}>
      <ClassProfile />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SHOW_CHAPTERS} exact={true}>
      <ShowChapters />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SEARCH_LESSON} exact={true}>
      <SearchLessons />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.LESSON_DETAILS} exact={true}>
      <LessonDetails />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.HOME_PAGE} exact={true}>
      <HomePage />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.STREAK_PAGE} exact={true}>
      <StreakPage />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.TEACHER_ASSIGNMENT} exact={true}>
      <TeacherLibraryAssignments />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.POST_SUCCESS} exact={true}>
      <PostSuccess />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.CLASS_USERS} exact={true}>
      <ClassUsers />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.EDIT_CLASS} exact={true}>
      <EditClass />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SCHOOL_LIST} exact={true}>
      <SchoolList />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.TEACHER_RECOMMENDED_ASSIGNMENTS} exact={true}>
      <TeacherRecommendedAssignments />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE} exact={true}>
      <ShowStudentsInAssignmentPage />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.ADD_TEACHER} exact={true}>
      <AddTeacher />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.TEACHER_PROFILE} exact={true}>
      <TeacherProfile />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SCHOOL_USERS} exact={true}>
      <SchoolUsers />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.ADD_PRINCIPAL} exact={true}>
      <AddSchoolUser />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.ADD_COORDINATOR} exact={true}>
      <AddSchoolUser />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.ADD_SPONSOR} exact={true}>
      <AddSchoolUser />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.UPLOAD_PAGE} exact={true}>
      <UploadPage />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.PROGRAM_PAGE} exact={true}>
      <ProgramsPage />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.REQUEST_LIST} exact={true}>
      <RequestList />
    </ProtectedRoute>
    <ProtectedRoute path={PAGES.SIDEBAR_PAGE}>
      <SidebarPage />
    </ProtectedRoute>
  </Switch>
);

export default AppRoutes;
