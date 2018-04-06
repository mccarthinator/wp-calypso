/** @format */
/**
 * External dependencies
 */
import { includes, noop } from 'lodash';

/**
 * Internal dependencies
 */
import { dispatchRequestEx } from 'state/data-layer/wpcom-http/utils';
import { http } from 'state/data-layer/wpcom-http/actions';
import {
	jetpackRemoteInstall,
	jetpackRemoteInstallComplete,
	jetpackRemoteInstallUpdateError,
} from 'state/jetpack-remote-install/actions';
import { JETPACK_REMOTE_INSTALL } from 'state/action-types';
import { recordTracksEvent, withAnalytics } from 'state/analytics/actions';

export const installJetpackPlugin = action =>
	http(
		{
			method: 'POST',
			path: '/jetpack-install/' + encodeURIComponent( action.url ),
			query: {
				user: action.user,
				password: action.password,
			},
		},
		action
	);

export const handleResponse = ( { url, user, password, retries }, data ) => {
	const logToTracks = withAnalytics(
		recordTracksEvent( 'calypso_jpc_remote_install_api_response', {
			remote_site_url: url,
			data: JSON.stringify( data ),
		} )
	);

	if ( data.status ) {
		return logToTracks( jetpackRemoteInstallComplete( url ) );
	}

	if ( data.error && includes( data.error.message, 'timed out' ) ) {
		if ( retries > 0 ) {
			return jetpackRemoteInstall( url, user, password, retries - 1 );
		}
	}

	return logToTracks( jetpackRemoteInstallUpdateError( url, data.error.code, data.error.message ) );
};

export default {
	[ JETPACK_REMOTE_INSTALL ]: [
		dispatchRequestEx( {
			fetch: installJetpackPlugin,
			onSuccess: handleResponse,
			onError: noop,
		} ),
	],
};
