/**
 * Hooks index
 * Exports all custom hooks organized by feature
 */
import useFollowUnfollow from './useFollowUnfollow';
import { useFollow } from './useFollow';
import useGetUserProfile from './useGetUserProfile';
import useLogout from './useLogout';
import usePreviewImg from './usePreviewImg';
import useShowToast from './useShowToast';
import { useSocket } from './useSocket';
import useTheme from './useTheme';

export {
  // User hooks
  useFollow,
  useFollowUnfollow,
  useGetUserProfile,
  useLogout,

  // UI hooks
  usePreviewImg,
  useShowToast,

  // Theme hooks
  useTheme,

  // Socket hooks
  useSocket,
};
