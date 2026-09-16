import { CreateUserData, CreateUserVariables, UpdateUserData, UpdateUserVariables, DeleteUserData, GetMeData, ListUsersData, CreateCourseData, CreateCourseVariables, UpdateCourseData, UpdateCourseVariables, DeleteCourseData, DeleteCourseVariables, GetCourseData, GetCourseVariables, ListCoursesData, EnrollData, EnrollVariables, UnenrollData, UnenrollVariables, ListMyEnrollmentsData, CreateGroupData, CreateGroupVariables, UpdateGroupData, UpdateGroupVariables, DeleteGroupData, DeleteGroupVariables, GetGroupData, GetGroupVariables, ListGroupsData, CreateEventData, CreateEventVariables, UpdateEventData, UpdateEventVariables, DeleteEventData, DeleteEventVariables, GetEventData, GetEventVariables, ListEventsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;

export function useUpdateUser(options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, UpdateUserVariables | void>): UseDataConnectMutationResult<UpdateUserData, UpdateUserVariables>;
export function useUpdateUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, UpdateUserVariables | void>): UseDataConnectMutationResult<UpdateUserData, UpdateUserVariables>;

export function useDeleteUser(options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;
export function useDeleteUser(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;

export function useGetMe(options?: useDataConnectQueryOptions<GetMeData>): UseDataConnectQueryResult<GetMeData, undefined>;
export function useGetMe(dc: DataConnect, options?: useDataConnectQueryOptions<GetMeData>): UseDataConnectQueryResult<GetMeData, undefined>;

export function useListUsers(options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;
export function useListUsers(dc: DataConnect, options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;

export function useCreateCourse(options?: useDataConnectMutationOptions<CreateCourseData, FirebaseError, CreateCourseVariables>): UseDataConnectMutationResult<CreateCourseData, CreateCourseVariables>;
export function useCreateCourse(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCourseData, FirebaseError, CreateCourseVariables>): UseDataConnectMutationResult<CreateCourseData, CreateCourseVariables>;

export function useUpdateCourse(options?: useDataConnectMutationOptions<UpdateCourseData, FirebaseError, UpdateCourseVariables>): UseDataConnectMutationResult<UpdateCourseData, UpdateCourseVariables>;
export function useUpdateCourse(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCourseData, FirebaseError, UpdateCourseVariables>): UseDataConnectMutationResult<UpdateCourseData, UpdateCourseVariables>;

export function useDeleteCourse(options?: useDataConnectMutationOptions<DeleteCourseData, FirebaseError, DeleteCourseVariables>): UseDataConnectMutationResult<DeleteCourseData, DeleteCourseVariables>;
export function useDeleteCourse(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteCourseData, FirebaseError, DeleteCourseVariables>): UseDataConnectMutationResult<DeleteCourseData, DeleteCourseVariables>;

export function useGetCourse(vars: GetCourseVariables, options?: useDataConnectQueryOptions<GetCourseData>): UseDataConnectQueryResult<GetCourseData, GetCourseVariables>;
export function useGetCourse(dc: DataConnect, vars: GetCourseVariables, options?: useDataConnectQueryOptions<GetCourseData>): UseDataConnectQueryResult<GetCourseData, GetCourseVariables>;

export function useListCourses(options?: useDataConnectQueryOptions<ListCoursesData>): UseDataConnectQueryResult<ListCoursesData, undefined>;
export function useListCourses(dc: DataConnect, options?: useDataConnectQueryOptions<ListCoursesData>): UseDataConnectQueryResult<ListCoursesData, undefined>;

export function useEnroll(options?: useDataConnectMutationOptions<EnrollData, FirebaseError, EnrollVariables>): UseDataConnectMutationResult<EnrollData, EnrollVariables>;
export function useEnroll(dc: DataConnect, options?: useDataConnectMutationOptions<EnrollData, FirebaseError, EnrollVariables>): UseDataConnectMutationResult<EnrollData, EnrollVariables>;

export function useUnenroll(options?: useDataConnectMutationOptions<UnenrollData, FirebaseError, UnenrollVariables>): UseDataConnectMutationResult<UnenrollData, UnenrollVariables>;
export function useUnenroll(dc: DataConnect, options?: useDataConnectMutationOptions<UnenrollData, FirebaseError, UnenrollVariables>): UseDataConnectMutationResult<UnenrollData, UnenrollVariables>;

export function useListMyEnrollments(options?: useDataConnectQueryOptions<ListMyEnrollmentsData>): UseDataConnectQueryResult<ListMyEnrollmentsData, undefined>;
export function useListMyEnrollments(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyEnrollmentsData>): UseDataConnectQueryResult<ListMyEnrollmentsData, undefined>;

export function useCreateGroup(options?: useDataConnectMutationOptions<CreateGroupData, FirebaseError, CreateGroupVariables>): UseDataConnectMutationResult<CreateGroupData, CreateGroupVariables>;
export function useCreateGroup(dc: DataConnect, options?: useDataConnectMutationOptions<CreateGroupData, FirebaseError, CreateGroupVariables>): UseDataConnectMutationResult<CreateGroupData, CreateGroupVariables>;

export function useUpdateGroup(options?: useDataConnectMutationOptions<UpdateGroupData, FirebaseError, UpdateGroupVariables>): UseDataConnectMutationResult<UpdateGroupData, UpdateGroupVariables>;
export function useUpdateGroup(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateGroupData, FirebaseError, UpdateGroupVariables>): UseDataConnectMutationResult<UpdateGroupData, UpdateGroupVariables>;

export function useDeleteGroup(options?: useDataConnectMutationOptions<DeleteGroupData, FirebaseError, DeleteGroupVariables>): UseDataConnectMutationResult<DeleteGroupData, DeleteGroupVariables>;
export function useDeleteGroup(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteGroupData, FirebaseError, DeleteGroupVariables>): UseDataConnectMutationResult<DeleteGroupData, DeleteGroupVariables>;

export function useGetGroup(vars: GetGroupVariables, options?: useDataConnectQueryOptions<GetGroupData>): UseDataConnectQueryResult<GetGroupData, GetGroupVariables>;
export function useGetGroup(dc: DataConnect, vars: GetGroupVariables, options?: useDataConnectQueryOptions<GetGroupData>): UseDataConnectQueryResult<GetGroupData, GetGroupVariables>;

export function useListGroups(options?: useDataConnectQueryOptions<ListGroupsData>): UseDataConnectQueryResult<ListGroupsData, undefined>;
export function useListGroups(dc: DataConnect, options?: useDataConnectQueryOptions<ListGroupsData>): UseDataConnectQueryResult<ListGroupsData, undefined>;

export function useCreateEvent(options?: useDataConnectMutationOptions<CreateEventData, FirebaseError, CreateEventVariables>): UseDataConnectMutationResult<CreateEventData, CreateEventVariables>;
export function useCreateEvent(dc: DataConnect, options?: useDataConnectMutationOptions<CreateEventData, FirebaseError, CreateEventVariables>): UseDataConnectMutationResult<CreateEventData, CreateEventVariables>;

export function useUpdateEvent(options?: useDataConnectMutationOptions<UpdateEventData, FirebaseError, UpdateEventVariables>): UseDataConnectMutationResult<UpdateEventData, UpdateEventVariables>;
export function useUpdateEvent(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateEventData, FirebaseError, UpdateEventVariables>): UseDataConnectMutationResult<UpdateEventData, UpdateEventVariables>;

export function useDeleteEvent(options?: useDataConnectMutationOptions<DeleteEventData, FirebaseError, DeleteEventVariables>): UseDataConnectMutationResult<DeleteEventData, DeleteEventVariables>;
export function useDeleteEvent(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteEventData, FirebaseError, DeleteEventVariables>): UseDataConnectMutationResult<DeleteEventData, DeleteEventVariables>;

export function useGetEvent(vars: GetEventVariables, options?: useDataConnectQueryOptions<GetEventData>): UseDataConnectQueryResult<GetEventData, GetEventVariables>;
export function useGetEvent(dc: DataConnect, vars: GetEventVariables, options?: useDataConnectQueryOptions<GetEventData>): UseDataConnectQueryResult<GetEventData, GetEventVariables>;

export function useListEvents(options?: useDataConnectQueryOptions<ListEventsData>): UseDataConnectQueryResult<ListEventsData, undefined>;
export function useListEvents(dc: DataConnect, options?: useDataConnectQueryOptions<ListEventsData>): UseDataConnectQueryResult<ListEventsData, undefined>;
