/** @format */

/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */

import { getSiteStatsNormalizedData } from 'state/stats/lists/selectors';

export default function( state, { siteId, statType, query, queryParams } ) {
	const rawData = getSiteStatsNormalizedData( state, siteId, statType, query );
	const { referrer } = queryParams;
	if ( ! referrer ) {
		return [];
	}
	return rawData.map( d => {
		return Object.assign( {}, d, {
			data: find( d.data, r => r.referrer === referrer ) || {},
		} );
	} );
}
