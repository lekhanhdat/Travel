import React from 'react';
import {FlatList, View} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import {IItem} from '../../../common/types';
import LargeItemLocation from '../../../component/LargeItemLocation';
import NavigationService from '../NavigationService';
import {convertCitationVietnameseUnsigned} from '../../../utils/Utils';
import LargeItemItem from '../../../component/LargeItemItem';
import locationApi from '../../../services/locations.api';

interface IViewAllItemsProps {
  navigation: any;
}

interface IViewAllItemsState {
  items: IItem[];
}

export default class AllItemScreen extends React.PureComponent<
  IViewAllItemsProps,
  IViewAllItemsState
> {
  constructor(props: IViewAllItemsProps) {
    super(props);
    this.state = {
      items: [],
    };
  }

  componentDidMount(): void {
    const itemsIn: IItem[] = this.props.navigation.state.params?.items ?? [];
    const valueSearch: string = this.props.navigation.state.params?.valueSearch;
    let itemsOut: IItem[] = [];
    itemsIn.forEach(item => {
      if (
        convertCitationVietnameseUnsigned(item.name ?? '')
          ?.toLowerCase()
          ?.includes(
            convertCitationVietnameseUnsigned(valueSearch)?.toLowerCase(),
          )
      ) {
        itemsOut = itemsOut.concat(item);
      }
    });
    this.setState({
      items: itemsOut,
    });
  }

  renderItem = ({item, index}: {item: IItem; index: number}) => {
    return <LargeItemItem item={item} />;
  };

  render(): React.ReactNode {
    return (
      <Page>
        <HeaderBase
          title={this.props.navigation.state.params?.title ?? ''}
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => {
            NavigationService.pop();
          }}
        />
        <View style={{padding: sizes._16sdp, flex: 1}}>
          <FlatList
            data={this.state.items}
            renderItem={this.renderItem}
            keyExtractor={item => item.name.toString()}
          />
        </View>
      </Page>
    );
  }
}
