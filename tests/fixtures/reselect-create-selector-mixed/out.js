import {createSelector, createStructuredSelector} from 'reselect';

createStructuredSelector({
    some1: someSelector1,
    some2: someSelector2,
    some3: someSelector3,
    some4: someSelector4
});


createSelector([], () => {});

const queryFilterSelector = createSelector(
    planIdSelector,
    querySelector,
    (planId, query) => {
        const queryWithPlanId = assign(query, { [FILTER_TYPE.PLANID]: planId });
        return queryToFilter(queryWithPlanId);
    }
);
