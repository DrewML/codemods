import {createSelector} from 'reselect';

createSelector([
        savedFilterListSelector,
        isCollapsedSelector,
        selectedFilterSelector,
        showFilterEditModeSelector
    ], function mapStateToProps(
        savedFiltersList,
        isCollapsed,
        selectedFilter,
        isEdit
    ) {
        return {
            isCollapsed,
            savedFiltersList,
            selectedFilter,
            isEdit
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
