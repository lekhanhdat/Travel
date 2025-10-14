import React from 'react';
import {View, Image} from 'react-native';
import {ProfileSvg} from '../assets/ImageSvg';
import colors from '../common/colors';
import sizes from '../common/sizes';

interface AvatarProps {
  avatarUrl?: string;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
}

/**
 * Utility component to render avatar with ProfileSvg fallback
 * @param avatarUrl - URL of the avatar image
 * @param size - Size of the avatar (default: sizes._36sdp)
 * @param backgroundColor - Background color for default avatar (default: colors.primary_100)
 * @param iconColor - Color of the ProfileSvg icon (default: colors.primary)
 */
export const Avatar: React.FC<AvatarProps> = ({
  avatarUrl,
  size = sizes._36sdp,
  backgroundColor = colors.primary_100,
  iconColor = colors.primary,
}) => {
  if (avatarUrl) {
    return (
      <Image
        source={{uri: avatarUrl}}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <ProfileSvg
        width={size * 0.6}
        height={size * 0.6}
        color={iconColor}
      />
    </View>
  );
};

/**
 * Utility function to get display name (fullName or userName)
 * @param account - User account object
 * @returns Display name string
 */
export const getDisplayName = (account: {fullName?: string; userName?: string} | null | undefined): string => {
  if (!account) return '-';
  return account.fullName || account.userName || '-';
};

/**
 * Utility function to get review author name (fullName or name_user_review)
 * @param review - Review object
 * @returns Author name string
 */
export const getReviewAuthorName = (review: {fullName?: string; name_user_review?: string} | null | undefined): string => {
  if (!review) return '-';
  return review.fullName || review.name_user_review || '-';
};
