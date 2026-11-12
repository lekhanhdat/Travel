import NavigationService from '../../container/screens/NavigationService';
import {ScreenName} from '../../container/AppContainer';
import {DiscoverItem} from './discover';

/** Location and festival keep their own Detail screens (different layouts). */
export function openDiscoverItem(item: DiscoverItem) {
  if (item.kind === 'festival') {
    NavigationService.navigate(ScreenName.DETAIL_FESTIVAL_SCREEN, {
      festival: item.festival,
    });
  } else {
    NavigationService.navigate(ScreenName.DETAIL_LOCATION_SCREEN, {
      location: item.location,
    });
  }
}
