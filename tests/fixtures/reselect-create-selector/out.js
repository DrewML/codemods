import {createSelector, createStructuredSelector} from 'reselect';

createStructuredSelector({
    savedFiltersList: savedFilterListSelector,
    isCollapsed: isCollapsedSelector,
    selectedFilter: selectedFilterSelector,
    isEdit: showFilterEditModeSelector
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
