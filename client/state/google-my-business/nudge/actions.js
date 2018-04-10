/** @format */

/**
 * Internal Dependencies
 */
import { getPreference } from 'state/preferences/selectors';
import { getSelectedSiteId } from 'state/ui/selectors';
import { savePreference } from 'state/preferences/actions';

const recordDismissAction = type => ( dispatch, getState ) => {
	const siteId = getSelectedSiteId( getState() );
	const preference = getPreference( getState(), 'google-my-business-dismissible-nudge' ) || {};

	return dispatch(
		savePreference(
			'google-my-business-dismissible-nudge',
			Object.assign( {}, preference, {
				[ siteId ]: [
					...( preference[ siteId ] || [] ),
					{
						dismissedAt: Date.now(),
						type,
					},
				],
			} )
		)
	);
};

export const dismissNudge = () => recordDismissAction( 'dismiss' );

export const alreadyListed = () => recordDismissAction( 'already-listed' );
