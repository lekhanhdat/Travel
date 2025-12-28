/**
 * Translation key to English text mapping
 * Keys match the old i18n system, values are English text for Azure translation
 */

// Flat map of all translation keys to English text
export const translationMap: Record<string, string> = {
  // Common
  'common.back': 'Back',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.success': 'Success',
  'common.error': 'Error',
  'common.loading': 'Loading...',
  'common.search': 'Search',
  'common.viewAll': 'View All',
  'common.close': 'Close',
  'common.confirm': 'Confirm',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.update': 'Update',
  'common.select': 'Select',
  'common.done': 'Done',
  'common.retry': 'Retry',
  'common.refresh': 'Refresh',

  // Home screen
  'home.greeting': 'Hello',
  'home.welcome': 'Welcome to Travel App',
  'home.popularPlaces': 'Popular Places',
  'home.nearbyPlaces': 'Nearby Places',
  'home.searchPlaceholder': 'Search places...',
  'home.exploreMore': 'Explore More',

  // Navigation
  'navigation.home': 'Home',
  'navigation.newFeed': 'Feed',
  'navigation.map': 'Map',
  'navigation.camera': 'Camera',
  'navigation.profile': 'Profile',

  // Profile
  'profile.title': 'Profile',
  'profile.personalInfo': 'Personal Information',
  'profile.accountInfo': 'Account Information',
  'profile.settings': 'Settings',
  'profile.faq': 'FAQ',
  'profile.policy': 'Privacy & Policy',
  'profile.about': 'About App',
  'profile.logout': 'Logout',
  'profile.editProfile': 'Edit Profile',
  'profile.language': 'Language',

  // Settings
  'settings.title': 'Settings',
  'settings.notifications': 'Notifications',
  'settings.pushNotifications': 'Push Notifications',
  'settings.pushNotificationsDesc':
    'Receive notifications about new places and updates',
  'settings.privacy': 'Privacy',
  'settings.locationServices': 'Location Services',
  'settings.locationServicesDesc': 'Allow app to access your location',
  'settings.sync': 'Synchronization',
  'settings.autoSync': 'Auto Sync',
  'settings.autoSyncDesc': 'Sync data when internet connection is available',
  'settings.interface': 'Interface',
  'settings.darkMode': 'Dark Mode',
  'settings.darkModeDesc': 'Use dark interface',
  'settings.darkModeTitle': 'Dark Mode',
  'settings.darkModeMessage':
    'This feature will be updated in the next version.',
  'settings.language': 'Language',
  'settings.storage': 'Storage',
  'settings.cache': 'Cache',
  'settings.cacheSize': 'Size',
  'settings.clearCache': 'Clear',
  'settings.clearCacheTitle': 'Clear Cache',
  'settings.clearCacheMessage':
    'Are you sure you want to delete all temporary data?',
  'settings.clearCacheSuccess': 'Cache cleared successfully!',

  // FAQ
  'faq.title': 'Frequently Asked Questions',
  'faq.searchFaq': 'Search questions...',
  'faq.contactSupport': 'Contact Support',
  'faq.noResults': 'No results found',

  // Policy
  'policy.title': 'Privacy & Policy',
  'policy.privacy': 'Privacy',
  'policy.terms': 'Terms of Service',
  'policy.security': 'Security',

  // About
  'about.title': 'About App',
  'about.version': 'Version',
  'about.developer': 'Developer',
  'about.contact': 'Contact',
  'about.rateApp': 'Rate App',
  'about.shareApp': 'Share App',
  'about.feedback': 'Feedback',

  // NewFeed
  'newFeed.title': 'Feed',
  'newFeed.addReview': 'Add Review',
  'newFeed.writeReview': 'Write Review',
  'newFeed.rating': 'Rating',
  'newFeed.comment': 'Comment',
  'newFeed.submit': 'Submit',
  'newFeed.reviews': 'Reviews',
  'newFeed.photos': 'Photos',
  'newFeed.likes': 'Likes',
  'newFeed.comments': 'Comments',
  'newFeed.viewMore': 'View More',
  'newFeed.loadMore': 'Load More',
  'newFeed.noReviews': 'No reviews yet',
};

/**
 * Get English text for a translation key
 * Returns the key itself if not found (for direct text usage)
 */
export function getEnglishText(key: string): string {
  return translationMap[key] || key;
}

/**
 * Check if a string is a translation key
 */
export function isTranslationKey(text: string): boolean {
  return text.includes('.') && translationMap.hasOwnProperty(text);
}

export default translationMap;
