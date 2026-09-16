import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Course_Key {
  id: UUIDString;
  __typename?: 'Course_Key';
}

export interface CreateCourseData {
  course_insert: Course_Key;
}

export interface CreateCourseVariables {
  courseCode: string;
  courseTitle: string;
  department?: string | null;
}

export interface CreateEventData {
  event_insert: Event_Key;
}

export interface CreateEventVariables {
  title: string;
  startTime: TimestampString;
  location: string;
  groupId: UUIDString;
  description?: string | null;
  maxAttendees?: number | null;
}

export interface CreateGroupData {
  group_insert: Group_Key;
}

export interface CreateGroupVariables {
  name: string;
  description: string;
  category: string;
  imageUrl?: string | null;
  isPrivate?: boolean | null;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  email: string;
  fullName: string;
  major: string;
  bio?: string | null;
  avatarUrl?: string | null;
  graduationYear?: number | null;
}

export interface DeleteCourseData {
  course_delete?: Course_Key | null;
}

export interface DeleteCourseVariables {
  id: UUIDString;
}

export interface DeleteEventData {
  event_delete?: Event_Key | null;
}

export interface DeleteEventVariables {
  id: UUIDString;
}

export interface DeleteGroupData {
  group_delete?: Group_Key | null;
}

export interface DeleteGroupVariables {
  id: UUIDString;
}

export interface DeleteUserData {
  user_delete?: User_Key | null;
}

export interface EnrollData {
  enrollment_insert: Enrollment_Key;
}

export interface EnrollVariables {
  courseId: UUIDString;
}

export interface Enrollment_Key {
  userId: UUIDString;
  courseId: UUIDString;
  __typename?: 'Enrollment_Key';
}

export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

export interface GetCourseData {
  course?: {
    courseCode: string;
    courseTitle: string;
    department?: string | null;
  };
}

export interface GetCourseVariables {
  id: UUIDString;
}

export interface GetEventData {
  event?: {
    title: string;
    startTime: TimestampString;
    location: string;
    description?: string | null;
  };
}

export interface GetEventVariables {
  id: UUIDString;
}

export interface GetGroupData {
  group?: {
    name: string;
    description: string;
    category: string;
  };
}

export interface GetGroupVariables {
  id: UUIDString;
}

export interface GetMeData {
  user?: {
    email: string;
    fullName: string;
    major: string;
    bio?: string | null;
    avatarUrl?: string | null;
    graduationYear?: number | null;
  };
}

export interface Group_Key {
  id: UUIDString;
  __typename?: 'Group_Key';
}

export interface ListCoursesData {
  courses: ({
    courseCode: string;
    courseTitle: string;
  })[];
}

export interface ListEventsData {
  events: ({
    title: string;
    startTime: TimestampString;
    location: string;
  })[];
}

export interface ListGroupsData {
  groups: ({
    name: string;
    category: string;
  })[];
}

export interface ListMyEnrollmentsData {
  enrollments: ({
    course: {
      courseCode: string;
      courseTitle: string;
    };
  })[];
}

export interface ListUsersData {
  users: ({
    fullName: string;
    major: string;
    graduationYear?: number | null;
  })[];
}

export interface UnenrollData {
  enrollment_delete?: Enrollment_Key | null;
}

export interface UnenrollVariables {
  courseId: UUIDString;
}

export interface UpdateCourseData {
  course_update?: Course_Key | null;
}

export interface UpdateCourseVariables {
  id: UUIDString;
  courseTitle?: string | null;
  department?: string | null;
}

export interface UpdateEventData {
  event_update?: Event_Key | null;
}

export interface UpdateEventVariables {
  id: UUIDString;
  description?: string | null;
  maxAttendees?: number | null;
}

export interface UpdateGroupData {
  group_update?: Group_Key | null;
}

export interface UpdateGroupVariables {
  id: UUIDString;
  description?: string | null;
  isPrivate?: boolean | null;
}

export interface UpdateUserData {
  user_update?: User_Key | null;
}

export interface UpdateUserVariables {
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  graduationYear?: number | null;
}

export interface UserGroup_Key {
  userId: UUIDString;
  groupId: UUIDString;
  __typename?: 'UserGroup_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface UpdateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpdateUserVariables): MutationRef<UpdateUserData, UpdateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: UpdateUserVariables): MutationRef<UpdateUserData, UpdateUserVariables>;
  operationName: string;
}
export const updateUserRef: UpdateUserRef;

export function updateUser(vars?: UpdateUserVariables): MutationPromise<UpdateUserData, UpdateUserVariables>;
export function updateUser(dc: DataConnect, vars?: UpdateUserVariables): MutationPromise<UpdateUserData, UpdateUserVariables>;

interface DeleteUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteUserData, undefined>;
  operationName: string;
}
export const deleteUserRef: DeleteUserRef;

export function deleteUser(): MutationPromise<DeleteUserData, undefined>;
export function deleteUser(dc: DataConnect): MutationPromise<DeleteUserData, undefined>;

interface GetMeRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMeData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMeData, undefined>;
  operationName: string;
}
export const getMeRef: GetMeRef;

export function getMe(options?: ExecuteQueryOptions): QueryPromise<GetMeData, undefined>;
export function getMe(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMeData, undefined>;

interface ListUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
  operationName: string;
}
export const listUsersRef: ListUsersRef;

export function listUsers(options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;
export function listUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface CreateCourseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCourseVariables): MutationRef<CreateCourseData, CreateCourseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCourseVariables): MutationRef<CreateCourseData, CreateCourseVariables>;
  operationName: string;
}
export const createCourseRef: CreateCourseRef;

export function createCourse(vars: CreateCourseVariables): MutationPromise<CreateCourseData, CreateCourseVariables>;
export function createCourse(dc: DataConnect, vars: CreateCourseVariables): MutationPromise<CreateCourseData, CreateCourseVariables>;

interface UpdateCourseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCourseVariables): MutationRef<UpdateCourseData, UpdateCourseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCourseVariables): MutationRef<UpdateCourseData, UpdateCourseVariables>;
  operationName: string;
}
export const updateCourseRef: UpdateCourseRef;

export function updateCourse(vars: UpdateCourseVariables): MutationPromise<UpdateCourseData, UpdateCourseVariables>;
export function updateCourse(dc: DataConnect, vars: UpdateCourseVariables): MutationPromise<UpdateCourseData, UpdateCourseVariables>;

interface DeleteCourseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCourseVariables): MutationRef<DeleteCourseData, DeleteCourseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteCourseVariables): MutationRef<DeleteCourseData, DeleteCourseVariables>;
  operationName: string;
}
export const deleteCourseRef: DeleteCourseRef;

export function deleteCourse(vars: DeleteCourseVariables): MutationPromise<DeleteCourseData, DeleteCourseVariables>;
export function deleteCourse(dc: DataConnect, vars: DeleteCourseVariables): MutationPromise<DeleteCourseData, DeleteCourseVariables>;

interface GetCourseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCourseVariables): QueryRef<GetCourseData, GetCourseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCourseVariables): QueryRef<GetCourseData, GetCourseVariables>;
  operationName: string;
}
export const getCourseRef: GetCourseRef;

export function getCourse(vars: GetCourseVariables, options?: ExecuteQueryOptions): QueryPromise<GetCourseData, GetCourseVariables>;
export function getCourse(dc: DataConnect, vars: GetCourseVariables, options?: ExecuteQueryOptions): QueryPromise<GetCourseData, GetCourseVariables>;

interface ListCoursesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCoursesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListCoursesData, undefined>;
  operationName: string;
}
export const listCoursesRef: ListCoursesRef;

export function listCourses(options?: ExecuteQueryOptions): QueryPromise<ListCoursesData, undefined>;
export function listCourses(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCoursesData, undefined>;

interface EnrollRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: EnrollVariables): MutationRef<EnrollData, EnrollVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: EnrollVariables): MutationRef<EnrollData, EnrollVariables>;
  operationName: string;
}
export const enrollRef: EnrollRef;

export function enroll(vars: EnrollVariables): MutationPromise<EnrollData, EnrollVariables>;
export function enroll(dc: DataConnect, vars: EnrollVariables): MutationPromise<EnrollData, EnrollVariables>;

interface UnenrollRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UnenrollVariables): MutationRef<UnenrollData, UnenrollVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UnenrollVariables): MutationRef<UnenrollData, UnenrollVariables>;
  operationName: string;
}
export const unenrollRef: UnenrollRef;

export function unenroll(vars: UnenrollVariables): MutationPromise<UnenrollData, UnenrollVariables>;
export function unenroll(dc: DataConnect, vars: UnenrollVariables): MutationPromise<UnenrollData, UnenrollVariables>;

interface ListMyEnrollmentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyEnrollmentsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyEnrollmentsData, undefined>;
  operationName: string;
}
export const listMyEnrollmentsRef: ListMyEnrollmentsRef;

export function listMyEnrollments(options?: ExecuteQueryOptions): QueryPromise<ListMyEnrollmentsData, undefined>;
export function listMyEnrollments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyEnrollmentsData, undefined>;

interface CreateGroupRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateGroupVariables): MutationRef<CreateGroupData, CreateGroupVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateGroupVariables): MutationRef<CreateGroupData, CreateGroupVariables>;
  operationName: string;
}
export const createGroupRef: CreateGroupRef;

export function createGroup(vars: CreateGroupVariables): MutationPromise<CreateGroupData, CreateGroupVariables>;
export function createGroup(dc: DataConnect, vars: CreateGroupVariables): MutationPromise<CreateGroupData, CreateGroupVariables>;

interface UpdateGroupRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateGroupVariables): MutationRef<UpdateGroupData, UpdateGroupVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateGroupVariables): MutationRef<UpdateGroupData, UpdateGroupVariables>;
  operationName: string;
}
export const updateGroupRef: UpdateGroupRef;

export function updateGroup(vars: UpdateGroupVariables): MutationPromise<UpdateGroupData, UpdateGroupVariables>;
export function updateGroup(dc: DataConnect, vars: UpdateGroupVariables): MutationPromise<UpdateGroupData, UpdateGroupVariables>;

interface DeleteGroupRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteGroupVariables): MutationRef<DeleteGroupData, DeleteGroupVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteGroupVariables): MutationRef<DeleteGroupData, DeleteGroupVariables>;
  operationName: string;
}
export const deleteGroupRef: DeleteGroupRef;

export function deleteGroup(vars: DeleteGroupVariables): MutationPromise<DeleteGroupData, DeleteGroupVariables>;
export function deleteGroup(dc: DataConnect, vars: DeleteGroupVariables): MutationPromise<DeleteGroupData, DeleteGroupVariables>;

interface GetGroupRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetGroupVariables): QueryRef<GetGroupData, GetGroupVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetGroupVariables): QueryRef<GetGroupData, GetGroupVariables>;
  operationName: string;
}
export const getGroupRef: GetGroupRef;

export function getGroup(vars: GetGroupVariables, options?: ExecuteQueryOptions): QueryPromise<GetGroupData, GetGroupVariables>;
export function getGroup(dc: DataConnect, vars: GetGroupVariables, options?: ExecuteQueryOptions): QueryPromise<GetGroupData, GetGroupVariables>;

interface ListGroupsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListGroupsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListGroupsData, undefined>;
  operationName: string;
}
export const listGroupsRef: ListGroupsRef;

export function listGroups(options?: ExecuteQueryOptions): QueryPromise<ListGroupsData, undefined>;
export function listGroups(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListGroupsData, undefined>;

interface CreateEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEventVariables): MutationRef<CreateEventData, CreateEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEventVariables): MutationRef<CreateEventData, CreateEventVariables>;
  operationName: string;
}
export const createEventRef: CreateEventRef;

export function createEvent(vars: CreateEventVariables): MutationPromise<CreateEventData, CreateEventVariables>;
export function createEvent(dc: DataConnect, vars: CreateEventVariables): MutationPromise<CreateEventData, CreateEventVariables>;

interface UpdateEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEventVariables): MutationRef<UpdateEventData, UpdateEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateEventVariables): MutationRef<UpdateEventData, UpdateEventVariables>;
  operationName: string;
}
export const updateEventRef: UpdateEventRef;

export function updateEvent(vars: UpdateEventVariables): MutationPromise<UpdateEventData, UpdateEventVariables>;
export function updateEvent(dc: DataConnect, vars: UpdateEventVariables): MutationPromise<UpdateEventData, UpdateEventVariables>;

interface DeleteEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteEventVariables): MutationRef<DeleteEventData, DeleteEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteEventVariables): MutationRef<DeleteEventData, DeleteEventVariables>;
  operationName: string;
}
export const deleteEventRef: DeleteEventRef;

export function deleteEvent(vars: DeleteEventVariables): MutationPromise<DeleteEventData, DeleteEventVariables>;
export function deleteEvent(dc: DataConnect, vars: DeleteEventVariables): MutationPromise<DeleteEventData, DeleteEventVariables>;

interface GetEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetEventVariables): QueryRef<GetEventData, GetEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetEventVariables): QueryRef<GetEventData, GetEventVariables>;
  operationName: string;
}
export const getEventRef: GetEventRef;

export function getEvent(vars: GetEventVariables, options?: ExecuteQueryOptions): QueryPromise<GetEventData, GetEventVariables>;
export function getEvent(dc: DataConnect, vars: GetEventVariables, options?: ExecuteQueryOptions): QueryPromise<GetEventData, GetEventVariables>;

interface ListEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEventsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListEventsData, undefined>;
  operationName: string;
}
export const listEventsRef: ListEventsRef;

export function listEvents(options?: ExecuteQueryOptions): QueryPromise<ListEventsData, undefined>;
export function listEvents(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListEventsData, undefined>;

