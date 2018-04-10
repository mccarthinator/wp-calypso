/** @format */

/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * Internal dependencies
 */
import createSelector from 'lib/create-selector';
import { getPreference } from 'state/preferences/selectors';
import { getSiteOption, getSitePlanSlug } from 'state/sites/selectors';
import { isGoogleMyBusinessLocationConnected } from 'state/google-my-business/selectors';
import { planMatches } from 'lib/plans';
import { TYPE_BUSINESS, GROUP_WPCOM } from 'lib/plans/constants';

const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;
const WEEK_IN_MS = WEEK_IN_SECONDS * 1000;
const MAX_DISMISS = 2;

/**
 * Returns the number of times the current user dismissed the nudge
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId The Id of the site
 * @return {Number}  Count  the number of times the nudge has been dismissed
 */
export const getGoogleMyBusinessStatsNudgeDismissCount = ( state, siteId ) => {
	const preference = getPreference( state, 'google-my-business-dismissible-nudge' ) || {};
	const sitePreference = preference[ siteId ] || [];

	return sitePreference.filter( event => 'dismiss' === event.type ).length;
};

/**
 * Returns the last time the nudge was dismissed by the current user or 0 if it was never dismissed
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId The Id of the site
 * @return {Number}  Timestamp marking the last time the nudge was dismissed
 */
const getLastDismissTime = ( state, siteId ) => {
	const preference = getPreference( state, 'google-my-business-dismissible-nudge' ) || {};
	const sitePreference = preference[ siteId ] || [];
	const lastEvent = last( sitePreference.filter( event => 'dismiss' === event.type ) );

	return lastEvent ? lastEvent.dismissedAt : 0;
};

/**
 * Returns true if the Google My Business nudge has recently been dismissed by the current user
 * and this action is still effective for this site
 *
 * The conditions for it to be effective (and thus make the nudge invisible) are the following:
 * - The last time it was dismissed must be less than 2 weeks ago
 * OR
 * - It must have been dismissed more than MAX_DISMISS times in total
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId The Id of the site
 * @return {Boolean} True if the nudge has been dismissed
 */
export const isGoogleMyBusinessStatsNudgeDismissed = ( state, siteId ) => {
	const lastDismissTime = getLastDismissTime( state, siteId );

	// Return false if it has never been dismissed
	if ( lastDismissTime === 0 ) {
		return false;
	}

	if ( getGoogleMyBusinessStatsNudgeDismissCount( state, siteId ) >= MAX_DISMISS ) {
		return true;
	}

	return lastDismissTime > Date.now() - 2 * WEEK_IN_MS;
};

/**
 * Returns true if site has promote goal set
 *
 * @param  {Object}  state  Global state tree
 * @param  {String}  siteId The Site ID
 * @return {Boolean} True if site has "promote" goal
 */
const siteHasPromoteGoal = createSelector(
	( state, siteId ) => {
		const siteGoals = ( getSiteOption( state, siteId, 'site_goals' ) || '' ).split( ',' );

		return siteGoals.indexOf( 'promote' ) !== -1;
	},
	( state, siteId ) => [ getSiteOption( state, siteId, 'site_goals' ) ]
);

/**
 * Returns true if site has business plan
 *
 * @param  {Object}  state  Global state tree
 * @param  {String}  siteId The Site ID
 * @return {Boolean} True if site has business plan
 */
export const siteHasBusinessPlan = createSelector(
	( state, siteId ) => {
		const slug = getSitePlanSlug( state, siteId );

		return planMatches( slug, { group: GROUP_WPCOM, type: TYPE_BUSINESS } );
	},
	( state, siteId ) => [ getSitePlanSlug( state, siteId ) ]
);

/**
 * Returns true if the Google My Business (GMB) nudge should be visible in stats
 *
 * It should be visible if:
 * - site is older than 1 week,
 * - site has a business plan
 * - site has a promote goal
 * @param  {Object}  state  Global state tree
 * @param  {String}  siteId The Site ID
 * @return {Boolean} True if we should show the nudge
 */
export const isGoogleMyBusinessStatsNudgeVisible = ( state, siteId ) => {
	if ( isGoogleMyBusinessLocationConnected( state, siteId ) ) {
		return false;
	}

	const createdAt = getSiteOption( state, siteId, 'created_at' );
	const isWeekPassedSinceSiteCreation = Date.parse( createdAt ) + WEEK_IN_SECONDS * 1000 < Date.now();

	return (
		isWeekPassedSinceSiteCreation &&
		siteHasBusinessPlan( state, siteId ) &&
		siteHasPromoteGoal( state, siteId )
	);
};
