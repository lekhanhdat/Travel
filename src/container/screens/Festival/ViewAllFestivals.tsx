import React from 'react';
import {FlatList, View} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import {IFestival} from '../../../services/festivals.api';
import LargeItemFestival from '../../../component/LargeItemFestival';
import NavigationService from '../NavigationService';
import {convertCitationVietnameseUnsigned} from '../../../utils/Utils';

interface IViewAllFestivalsProps {
  navigation: any;
}

interface IViewAllFestivalsState {
  festivals: IFestival[];
}

export default class ViewAllFestivals extends React.PureComponent<
  IViewAllFestivalsProps,
  IViewAllFestivalsState
> {
  constructor(props: IViewAllFestivalsProps) {
    super(props);
    this.state = {
      festivals: [],
    };
  }

  componentDidMount(): void {
    console.log(this.props.navigation.state.params);
    const festivalsIn: IFestival[] =
      this.props.navigation.state.params?.festivals ?? [];
    const valueSearch: string =
      this.props.navigation.state.params?.valueSearch ?? '';
    let festivalOut: IFestival[] = [];

    festivalsIn.forEach(festival => {
      // Search by name, description, and location
      const nameMatch = convertCitationVietnameseUnsigned(festival.name ?? '')
        ?.toLowerCase()
        ?.includes(convertCitationVietnameseUnsigned(valueSearch)?.toLowerCase());

      const descriptionMatch = convertCitationVietnameseUnsigned(
        festival.description ?? '',
      )
        ?.toLowerCase()
        ?.includes(convertCitationVietnameseUnsigned(valueSearch)?.toLowerCase());

      const locationMatch = convertCitationVietnameseUnsigned(
        festival.location ?? '',
      )
        ?.toLowerCase()
        ?.includes(convertCitationVietnameseUnsigned(valueSearch)?.toLowerCase());

      if (nameMatch || descriptionMatch || locationMatch) {
        festivalOut = festivalOut.concat(festival);
      }
    });

    this.setState({
      festivals: festivalOut,
    });
  }

  renderItem = ({item, index}: {item: IFestival; index: number}) => {
    return <LargeItemFestival festival={item} />;
  };

  render(): React.ReactNode {
    return (
      <Page>
        <HeaderBase
          title={this.props.navigation.state.params?.title ?? 'Lễ hội'}
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
            data={this.state.festivals}
            renderItem={this.renderItem}
            keyExtractor={item => item.Id?.toString() ?? Math.random().toString()}
          />
        </View>
      </Page>
    );
  }
}

