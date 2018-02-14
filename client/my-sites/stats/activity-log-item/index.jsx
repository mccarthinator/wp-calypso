/** @format */
/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import scrollTo from 'lib/scroll-to';
import { localize } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import ActivityActor from './activity-actor';
import ActivityIcon from './activity-icon';
import ActivityLogConfirmDialog from '../activity-log-confirm-dialog';
import Gridicon from 'gridicons';
import HappychatButton from 'components/happychat/button';
import Button from 'components/button';
import SplitButton from 'components/split-button';
import FoldableCard from 'components/foldable-card';
import FormattedBlock from 'components/notes-formatted-block';
import PopoverMenuItem from 'components/popover/menu-item';
import {
	rewindBackup,
	rewindBackupDismiss,
	rewindRequestBackup,
	rewindRequestDismiss,
	rewindRequestRestore,
	rewindRestore,
} from 'state/activity-log/actions';
import { recordTracksEvent, withAnalytics } from 'state/analytics/actions';
import {
	getActivityLog,
	getRequestedBackup,
	getRequestedRewind,
	getSiteGmtOffset,
	getSiteTimezoneValue,
	getRewindState,
} from 'state/selectors';
import { adjustMoment } from '../activity-log/utils';
import { getSiteSlug, getSite } from 'state/sites/selectors';
import { updatePlugin } from 'state/plugins/installed/actions';
import { getPluginOnSite, getStatusForPlugin } from 'state/plugins/installed/selectors';

class ActivityLogItem extends Component {
	static propTypes = {
		siteId: PropTypes.number.isRequired,

		// Connected props
		siteSlug: PropTypes.string.isRequired,

		// localize
		translate: PropTypes.func.isRequired,
	};

	confirmBackup = () => this.props.confirmBackup( this.props.activity.rewindId );

	confirmRewind = () => this.props.confirmRewind( this.props.activity.rewindId );

	updatePlugin = () => this.props.updatePlugin( this.props.plugin );

	renderHeader() {
		const {
			activityDescription,
			activityTitle,
			actorAvatarUrl,
			actorName,
			actorRole,
			actorType,
		} = this.props.activity;

		return (
			<div className="activity-log-item__card-header">
				<ActivityActor { ...{ actorAvatarUrl, actorName, actorRole, actorType } } />
				<div className="activity-log-item__description">
					<div className="activity-log-item__description-content">
						{ /* There is no great way to generate a more valid React key here
						  * but the index is probably sufficient because these sub-items
						  * shouldn't be changing.
						  */ }
						{ activityDescription.map( ( part, i ) => (
							<FormattedBlock key={ i } content={ part } />
						) ) }
					</div>
					<div className="activity-log-item__description-summary">{ activityTitle }</div>
				</div>
			</div>
		);
	}

	renderItemAction() {
		const {
			hideRestore,
			activity: { activityIsRewindable, activityName, activityMeta },
			plugin,
			pluginStatus,
			translate,
		} = this.props;

		switch ( activityName ) {
			case 'plugin__update_available':
				switch ( pluginStatus.status ) {
					case 'inProgress':
						return (
							<span className="activity-log-item__quick-action-progress">
								{ translate( 'Updating…' ) }
							</span>
						);

					case 'completed':
						return (
							<span className="activity-log-item__quick-action-success">
								{ translate( 'Updated!' ) }
							</span>
						);

					case 'error':
						return (
							<span className="activity-log-item__quick-action-error">
								{ translate( 'Error!' ) + ' ' }
								{ pluginStatus.error }
							</span>
						);
				}
				return (
					plugin.update && (
						<Button
							primary
							compact
							className="activity-log-item__action"
							onClick={ this.updatePlugin }
						>
							{ translate( 'Update plugin' ) }
						</Button>
					)
				);
			case 'plugin__update_failed':
			case 'rewind__scan_result_found':
				return this.renderHelpAction();
			case 'rewind__backup_error':
				return 'bad_credentials' === activityMeta.errorCode
					? this.renderFixCredsAction()
					: this.renderHelpAction();
		}

		if ( ! hideRestore && activityIsRewindable ) {
			return this.renderRewindAction();
		}
	}

	renderRewindAction() {
		const { createBackup, createRewind, disableRestore, disableBackup, translate } = this.props;

		return (
			<div className="activity-log-item__quick-action">
				<SplitButton
					icon="history"
					label={ translate( 'Rewind' ) }
					onClick={ createRewind }
					disableMain={ disableRestore }
					disabled={ disableRestore && disableBackup }
					compact
					primary={ ! disableRestore }
				>
					<PopoverMenuItem
						disabled={ disableBackup }
						icon="cloud-download"
						onClick={ createBackup }
					>
						{ translate( 'Download backup' ) }
					</PopoverMenuItem>
				</SplitButton>
			</div>
		);
	}

	/**
	 * Displays a button for users to get help. Tracks button click.
	 *
	 * @returns {Object} Get help button.
	 */
	renderHelpAction = () => (
		<HappychatButton
			className="activity-log-item__help-action"
			borderless={ false }
			onClick={ this.handleTrackHelp }
		>
			<Gridicon icon="chat" size={ 18 } />
			{ this.props.translate( 'Get help' ) }
		</HappychatButton>
	);

	handleTrackHelp = () => this.props.trackHelp( this.props.activity.activityName );

	/**
	 * Displays a button to take users to enter credentials.
	 *
	 * @returns {Object} Get button to fix credentials.
	 */
	renderFixCredsAction = () => {
		const { rewindState, siteId, siteSlug, trackFixCreds, translate } = this.props;
		return (
			<Button
				className="activity-log-item__quick-action"
				primary
				compact
				href={
					rewindState.canAutoconfigure
						? `/start/rewind-auto-config/?blogid=${ siteId }&siteSlug=${ siteSlug }`
						: `/start/rewind-setup/?siteId=${ siteId }&siteSlug=${ siteSlug }`
				}
				onClick={ trackFixCreds }
			>
				{ translate( 'Fix credentials' ) }
			</Button>
		);
	};

	render() {
		const {
			activity,
			className,
			dismissBackup,
			dismissRewind,
			gmtOffset,
			isDiscarded,
			mightBackup,
			mightRewind,
			moment,
			timezone,
			translate,
		} = this.props;
		const { activityIcon, activityStatus, activityTs } = activity;

		const classes = classNames( 'activity-log-item', className, {
			'is-discarded': isDiscarded,
		} );

		const adjustedTime = adjustMoment( { gmtOffset, moment: moment.utc( activityTs ), timezone } );

		return (
			<React.Fragment>
				{ mightRewind && (
					<ActivityLogConfirmDialog
						key="activity-rewind-dialog"
						confirmTitle={ translate( 'Confirm Rewind' ) }
						notice={
							// eslint-disable-next-line wpcalypso/jsx-classname-namespace
							<span className="activity-log-confirm-dialog__notice-content">
								{ translate(
									'This will remove all content and options created or changed since then.'
								) }
							</span>
						}
						onClose={ dismissRewind }
						onConfirm={ this.confirmRewind }
						supportLink="https://jetpack.com/support/how-to-rewind"
						title={ translate( 'Rewind Site' ) }
					>
						{ translate(
							'This is the selected point for your site Rewind. ' +
								'Are you sure you want to rewind your site back to {{time/}}?',
							{
								components: {
									time: <b>{ adjustedTime.format( 'LLL' ) }</b>,
								},
							}
						) }
					</ActivityLogConfirmDialog>
				) }
				{ mightBackup && (
					<ActivityLogConfirmDialog
						key="activity-backup-dialog"
						confirmTitle={ translate( 'Create download' ) }
						onClose={ dismissBackup }
						onConfirm={ this.confirmBackup }
						supportLink="https://jetpack.com/support/backups"
						title={ translate( 'Create downloadable backup' ) }
						type={ 'backup' }
						icon={ 'cloud-download' }
					>
						{ translate(
							'We will build a downloadable backup of your site at {{time/}}. ' +
								'You will get a notification when the backup is ready to download.',
							{
								components: {
									time: <b>{ adjustedTime.format( 'LLL' ) }</b>,
								},
							}
						) }
					</ActivityLogConfirmDialog>
				) }
				<div className={ classes }>
					<div className="activity-log-item__type">
						<div className="activity-log-item__time">{ adjustedTime.format( 'LT' ) }</div>
						<ActivityIcon activityIcon={ activityIcon } activityStatus={ activityStatus } />
					</div>
					<FoldableCard
						className="activity-log-item__card"
						expandedSummary={ this.renderItemAction() }
						header={ this.renderHeader() }
						summary={ this.renderItemAction() }
					/>
				</div>
			</React.Fragment>
		);
	}
}

const mapStateToProps = ( state, { activityId, siteId } ) => {
	const activity = getActivityLog( state, siteId, activityId );
	const pluginSlug = get( activity.activityMeta, 'pluginSlug', {} );
	const pluginId = get( activity.activityMeta, 'pluginId', {} );
	return {
		activity,
		gmtOffset: getSiteGmtOffset( state, siteId ),
		mightBackup: activityId && activityId === getRequestedBackup( state, siteId ),
		mightRewind: activityId && activityId === getRequestedRewind( state, siteId ),
		timezone: getSiteTimezoneValue( state, siteId ),
		siteSlug: getSiteSlug( state, siteId ),
		rewindState: getRewindState( state, siteId ),
		site: getSite( state, siteId ),
		plugin: getPluginOnSite( state, siteId, pluginSlug ),
		pluginStatus: getStatusForPlugin( state, siteId, pluginId ),
	};
};

const mapDispatchToProps = ( dispatch, { activityId, siteId } ) => ( {
	createBackup: () =>
		dispatch(
			withAnalytics(
				recordTracksEvent( 'calypso_activitylog_backup_request', { from: 'item' } ),
				rewindRequestBackup( siteId, activityId )
			)
		),
	createRewind: () =>
		dispatch(
			withAnalytics(
				recordTracksEvent( 'calypso_activitylog_restore_request', { from: 'item' } ),
				rewindRequestRestore( siteId, activityId )
			)
		),
	dismissBackup: () =>
		dispatch(
			withAnalytics(
				recordTracksEvent( 'calypso_activitylog_backup_cancel' ),
				rewindBackupDismiss( siteId )
			)
		),
	dismissRewind: () =>
		dispatch(
			withAnalytics(
				recordTracksEvent( 'calypso_activitylog_restore_cancel' ),
				rewindRequestDismiss( siteId )
			)
		),
	confirmBackup: rewindId => (
		scrollTo( { x: 0, y: 0, duration: 250 } ),
		dispatch(
			withAnalytics(
				recordTracksEvent( 'calypso_activitylog_backup_confirm', { action_id: rewindId } ),
				rewindBackup( siteId, rewindId )
			)
		)
	),
	confirmRewind: rewindId => (
		scrollTo( { x: 0, y: 0, duration: 250 } ),
		dispatch(
			withAnalytics(
				recordTracksEvent( 'calypso_activitylog_restore_confirm', { action_id: rewindId } ),
				rewindRestore( siteId, rewindId )
			)
		)
	),
	trackHelp: activityName =>
		dispatch(
			recordTracksEvent( 'calypso_activitylog_event_get_help', { activity_name: activityName } )
		),
	trackFixCreds: () => dispatch( recordTracksEvent( 'calypso_activitylog_event_fix_credentials' ) ),
	updatePlugin: plugin => dispatch( updatePlugin( siteId, plugin ) ),
} );

export default connect( mapStateToProps, mapDispatchToProps )( localize( ActivityLogItem ) );
