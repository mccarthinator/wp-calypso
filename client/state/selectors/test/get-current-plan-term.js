/** @format */

/**
 * Internal dependencies
 */

import * as plansLib from 'lib/plans';
import { getSitePlan } from 'state/sites/selectors';
import getCurrentPlanTerm from '../get-current-plan-term';
import { TERM_ANNUALLY, TERM_BIENNIALLY, TERM_MONTHLY } from 'lib/plans/constants';

jest.mock( 'state/sites/selectors', () => ( {
	getSitePlan: jest.fn( () => ( {} ) ),
} ) );

describe( 'getCurrentPlanTerm', () => {
	const state = {};

	beforeEach( () => {
		plansLib.getPlan = jest.fn();
		getSitePlan.mockImplementation( () => ( {} ) );
	} );

	test( 'should return 2-year intervalType if current plan is a 2-year plan', () => {
		plansLib.getPlan.mockImplementation( () => ( {
			term: TERM_BIENNIALLY,
		} ) );
		const result = getCurrentPlanTerm( state, {} );
		expect( result ).toBe( TERM_BIENNIALLY );
	} );

	test( 'should return 1-year intervalType if current plan is a 1-year plan', () => {
		plansLib.getPlan.mockImplementation( () => ( {
			term: TERM_ANNUALLY,
		} ) );
		const result = getCurrentPlanTerm( state, {} );
		expect( result ).toBe( TERM_ANNUALLY );
	} );

	test( 'should return monthly intervalType if current plan is a monthly plan', () => {
		plansLib.getPlan.mockImplementation( () => ( {
			term: TERM_MONTHLY,
		} ) );
		const result = getCurrentPlanTerm( state, {} );
		expect( result ).toBe( TERM_MONTHLY );
	} );

	test( 'should return null intervalType if no product can be identified', () => {
		getSitePlan.mockImplementation( () => null );
		const result = getCurrentPlanTerm( state, {} );
		expect( result ).toBe( null );
		getSitePlan.mockImplementation( () => ( {} ) );
	} );

	test( 'should return null intervalType if no plan can be identified', () => {
		getSitePlan.mockImplementation( () => ( {} ) );
		plansLib.getPlan.mockImplementation( () => null );
		const result = getCurrentPlanTerm( state, {} );
		expect( result ).toBe( null );
	} );
} );
