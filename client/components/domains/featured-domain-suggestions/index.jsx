/** @format */

/**
 * External dependencies
 */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { localize } from 'i18n-calypso';
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import DomainRegistrationSuggestion from 'components/domains/domain-registration-suggestion';

export class FeaturedDomainSuggestions extends Component {
	static propTypes = {
		cart: PropTypes.object,
		primarySuggestion: PropTypes.object,
		secondarySuggestion: PropTypes.object,
	};

	getChildProps() {
		const childKeys = [
			'cart',
			'isSignupStep',
			'selectedSite',
			'domainsWithPlansOnly',
			'query',
			'onButtonClick',
		];
		return pick( this.props, childKeys );
	}

	// TODO: Remove this before committing to master. This mocks match reasons into
	//       domain suggestions for testing purposes.
	getSuggestionsForTesting() {
		const primarySuggestion = {
			...this.props.primarySuggestion,
			matchReasons: [ 'tld-exact', 'exact-match' ],
		};
		const secondarySuggestion = {
			...this.props.secondarySuggestion,
			matchReasons: [ 'similar-match', 'tld-common' ],
		};
		return { primarySuggestion, secondarySuggestion };
	}

	hasMatchReasons() {
		// TODO: Enable the following and remove use of getSuggestionsForTesting
		// const { primarySuggestion, secondarySuggestion } = this.props;
		const { primarySuggestion, secondarySuggestion } = this.getSuggestionsForTesting();
		return (
			Array.isArray( primarySuggestion.matchReasons ) ||
			Array.isArray( secondarySuggestion.matchReasons )
		);
	}

	render() {
		// TODO: Enable the following and remove use of getSuggestionsForTesting
		// const { primarySuggestion, secondarySuggestion } = this.props;
		const { primarySuggestion, secondarySuggestion } = this.getSuggestionsForTesting();
		const childProps = this.getChildProps();
		const className = classNames( 'featured-domain-suggestions', {
			'featured-domain-suggestions--has-match-reasons': this.hasMatchReasons(),
		} );

		return (
			<div className={ className }>
				<DomainRegistrationSuggestion
					suggestion={ primarySuggestion }
					isFeatured
					{ ...childProps }
				/>
				<DomainRegistrationSuggestion
					suggestion={ secondarySuggestion }
					isFeatured
					{ ...childProps }
				/>
			</div>
		);
	}
}

export default localize( FeaturedDomainSuggestions );
