import {createSelector} from 'reselect';

createSelector([
        someSelector1,
        someSelector2,
        someSelector3,
        someSelector4
    ], function mapStateToProps(
        some1,
        some2,
        some3,
        some4
    ) {
        return {
            some1,
            some2,
            some3,
            some4
        };
    }
);


createSelector([], () => {});

const queryFilterSelector = createSelector(
    planIdSelector,
    querySelector,
    (planId, query) => {
        const queryWithPlanId = assign(query, { [FILTER_TYPE.PLANID]: planId });
        return queryToFilter(queryWithPlanId);
    }
);
