/** @format */

/**
 * External dependencies
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { findIndex } from 'lodash';
import page from 'page';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import ElementChart from 'components/chart';
import Legend from 'components/chart/legend';
import Tabs from 'my-sites/stats/stats-tabs';
import Tab from 'my-sites/stats/stats-tabs/tab';
import { getWidgetPath, formatValue } from 'woocommerce/app/store-stats/utils';
import { recordTrack } from 'woocommerce/lib/analytics';
import { referrerChartTabs as tabs } from 'woocommerce/app/store-stats/constants';

class Chart extends Component {
	static propTypes = {
		data: PropTypes.array.isRequired,
		selectedDate: PropTypes.string,
		selectedReferrer: PropTypes.string,
		chartFormat: PropTypes.string,
	};

	state = {
		selectedTabIndex: 0,
	};

	legendClick() {}

	barClick = bar => {
		const { unit, slug, queryParams } = this.props;
		const query = Object.assign( {}, queryParams, { startDate: bar.date } );
		const path = getWidgetPath( unit, slug, query );
		page( `/store/stats/referrers${ path }` );
	};

	tabClick = tab => {
		this.setState( {
			selectedTabIndex: tab.index,
		} );

		recordTrack( 'calypso_woocommerce_stats_referrers_chart_tab_click', {
			tab: tabs[ tab.index ].attr,
		} );
	};

	buildChartData = item => {
		const { selectedDate, chartFormat } = this.props;
		const { selectedTabIndex } = this.state;
		const selectedTab = tabs[ selectedTabIndex ];
		const className = classnames( item.classNames.join( ' ' ), {
			'is-selected': item.date === selectedDate,
		} );
		let nestedValue = null;
		switch ( selectedTab.attr ) {
			case 'product_views':
				nestedValue = item.data.add_to_carts || 0;
				break;
			case 'add_to_carts':
				nestedValue = item.data.product_purchases || 0;
		}
		return {
			label: item[ chartFormat ],
			value: item.data[ selectedTab.attr ] || 0,
			data: item.data,
			date: item.date,
			nestedValue,
			className,
		};
	};

	formatTabValue = ( isSales, currency ) => {
		if ( isSales ) {
			return value => formatValue( value, 'currency', currency, { precision: 0 } );
		}
		return value => formatValue( value, 'number' );
	};

	render() {
		const { data, selectedDate } = this.props;
		const chartData = data.map( this.buildChartData );
		const { selectedTabIndex } = this.state;
		// const selectedTab = tabs[ selectedTabIndex ];
		const selectedIndex = findIndex( data, d => d.date === selectedDate );
		return (
			<Card className="chart stats-module">
				<Legend
					activeTab={ tabs[ 0 ] }
					availableCharts={ [] }
					activeCharts={ [] }
					tabs={ tabs }
					clickHandler={ this.legendClick }
				/>
				<ElementChart data={ chartData } barClick={ this.barClick } />
				{ data.length && (
					<Tabs data={ chartData }>
						{ tabs.map( ( tab, index ) => {
							const item = chartData[ selectedIndex ].data;
							const value = item[ tab.attr ];
							const isSales = tab.attr === 'sales';
							return (
								<Tab
									key={ tab.attr }
									index={ index }
									label={ tab.label }
									selected={ index === selectedTabIndex }
									tabClick={ this.tabClick }
									gridicon={ tab.gridicon }
									value={ value }
									format={ this.formatTabValue( isSales, item.currency ) }
								/>
							);
						} ) }
					</Tabs>
				) }
			</Card>
		);
	}
}

export default Chart;
