/** @format */

/**
 * External dependencies
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { findIndex } from 'lodash';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import ElementChart from 'components/chart';
import Legend from 'components/chart/legend';
import Tabs from 'my-sites/stats/stats-tabs';
import Tab from 'my-sites/stats/stats-tabs/tab';

const tabs = [
	{ label: 'Sales', attr: 'sales', gridicon: 'money' },
	{ label: 'Views', attr: 'product_views', gridicon: 'visible' },
	{ label: 'Add to Carts', attr: 'add_to_carts', gridicon: 'cart' },
	{ label: 'Purchases', attr: 'product_purchases', gridicon: 'star' },
];

class Chart extends Component {
	static propTypes = {
		data: PropTypes.array.isRequired,
		unitSelectedDate: PropTypes.string,
		selectedReferrer: PropTypes.string,
	};

	state = {
		selectedTabIndex: 0,
	};

	barClick() {}

	legendClick() {}

	tabClick = tab => {
		this.setState( {
			selectedTabIndex: tab.index,
		} );
	};

	buildChartData = item => {
		const { unitSelectedDate, chartFormat } = this.props;
		const selectedTab = tabs[ this.state.selectedTabIndex ];
		const className = classnames( {
			'is-selected': item.date === unitSelectedDate,
		} );
		return {
			label: item[ chartFormat ],
			value: item.data[ selectedTab.attr ] || 0,
			data: item.data,
			className,
		};
	};

	render() {
		const { data, unitSelectedDate } = this.props;
		const chartData = data.map( this.buildChartData );
		const { selectedTabIndex } = this.state;
		// const selectedTab = tabs[ selectedTabIndex ];
		const selectedIndex = findIndex( data, d => d.date === unitSelectedDate );
		return (
			<Card className="stats-module">
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
							return (
								<Tab
									key={ tab.attr }
									index={ index }
									label={ tab.label }
									selected={ index === selectedTabIndex }
									tabClick={ this.tabClick }
									gridicon={ tab.gridicon }
									value={ value }
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
