import {createSelector} from 'reselect';

createSelector([
        thingSelector1,
        thingSelector2,
        thingSelector3,
        thingSelector4
    ], function mapStateToProps(
        thing1,
        thing2,
        thing3,
        thing4
    ) {
        return {
            thing1,
            thing2,
            thing3,
            thing4
        };
    }
);
