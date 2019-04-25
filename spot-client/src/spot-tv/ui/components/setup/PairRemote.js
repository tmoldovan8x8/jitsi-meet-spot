import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { getJoinCode } from 'common/app-state';
import { Button } from 'common/ui';

/**
 * Displays a setup step showing a join code to connect a Spot-Remote
 *
 * @extends React.Component
 */
export class PairRemote extends React.Component {
    static propTypes = {
        joinCode: PropTypes.string,
        onSuccess: PropTypes.func
    };

    /**
     * Initializes a new {@code PairRemote} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onNext = this._onNext.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = 'spot-setup pair-remote'>
                <div className = 'setup-title'>
                    Pair your remote
                </div>
                <div className = 'setup-content'>
                    <div className = 'description'>
                        Would you like to pair a permanent remote control with this room?
                    </div>
                    <div className = 'join-code'>
                        { this.props.joinCode }
                    </div>
                </div>
                <div className = 'setup-buttons'>
                    <Button
                        onClick = { this._onNext }
                        qaId = 'device-selection-submit'>
                        Next
                    </Button>
                    <Button
                        appearance = 'subtle'
                        onClick = { this._onNext }>
                        Skip
                    </Button>
                </div>
            </div>
        );
    }

    /**
     * Completes the current setup step.
     *
     * @private
     * @returns {void}
     */
    _onNext() {
        this.props.onSuccess();
    }
}

/**
 * Selects parts of the Redux state to pass in with the props of
 * {@code RoomName}.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        joinCode: getJoinCode(state)
    };
}

export default connect(mapStateToProps)(PairRemote);