/** @format */

/**
 * External dependencies
 */
import { get } from 'lodash';

const getGoogleMyBusinessLocationId = ( state, siteId ) => {
	return get( state, `googleMyBusiness.${ siteId }.location.id`, null );
};

export const isGoogleMyBusinessLocationConnected = ( state, siteId ) => {
	return getGoogleMyBusinessLocationId( state, siteId ) !== null;
};
