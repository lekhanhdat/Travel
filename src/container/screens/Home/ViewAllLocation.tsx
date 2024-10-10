import React from 'react';
import { FlatList, View } from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import { BackSvg } from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import { ILocation } from '../../../common/types';
import LargeItemLocation from '../../../component/LargeItemLocation';
import NavigationService from '../NavigationService';
import { convertCitationVietnameseUnsigned } from '../../../utils/Utils';

interface IViewAllLocationProps {
  navigation: any;
}

interface IViewAllLocationState { locations: ILocation[] }

export default class ViewAllLocation extends React.PureComponent<
  IViewAllLocationProps,
  IViewAllLocationState
> {
  constructor(props: IViewAllLocationProps) {
    super(props);
    this.state = {
      locations: []
    };
  }

  componentDidMount(): void {
    console.log(this.props.navigation.state.params)
    const locationsIn: ILocation[] = this.props.navigation.state.params?.locations ?? [];
    const valueSearch: string = this.props.navigation.state.params?.valueSearch;
    let locationOut: ILocation[] = [];
    locationsIn.forEach(location => {
      if (convertCitationVietnameseUnsigned(location.name ?? '')?.toLowerCase()?.includes(convertCitationVietnameseUnsigned(valueSearch)?.toLowerCase())) {
        locationOut = locationOut.concat(location)
      }
    })
    this.setState({
      locations: locationOut
    })
  }

  renderItem = ({ item, index }: { item: ILocation, index: number }) => {
    return <LargeItemLocation location={item} />
  }

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
            NavigationService.pop()
          }}
        />
        <View style={{ padding: sizes._16sdp, flex: 1 }}>
          <FlatList
            data={this.state.locations}
            renderItem={this.renderItem}
            keyExtractor={(item) => item.name.toString()}
          />
        </View>
      </Page>
    );
  }
}
