import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { addNotification } from 'common/actions';
import { logger } from 'common/logger';
import {
    getCurrentLock,
    getCurrentRoomName,
    getRemoteControlServerConfig
} from 'common/reducers';
import { remoteControlService } from 'common/remote-control';
import { AbstractLoader, generateWrapper } from 'common/ui';

/**
 * Loads application services while displaying a loading icon. Will display
 * the passed-in children when loading is complete.
 *
 * @extends React.Component
 */
export class RemoteControlLoader extends AbstractLoader {
    static propTypes = {
        ...AbstractLoader.propTypes,
        dispatch: PropTypes.func
    };

    /**
     * Initializes a new {@code RemoteControlLoader} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * Whether or not a reconnect attempt is in progress. Used to prevent
         * multiple reconnects from being in flight at the same time.
         *
         * @type {boolean}
         */
        this._isReconnectQueued = false;

        /**
         * The number of successive reconnect attempt made. After the limit of
         * three attempts is reached, reconnects will be aborted and the login
         * page will be displayed.
         *
         * @type {number}
         */
        this._reconnectCount = 0;

        /**
         * Whether or not the current instance of {@code RemoteControlLoader} is
         * mounted. Used to prevent the various async remote control service
         * connection flows from firing.
         *
         * @type {boolean}
         */
        this._unmounted = false;
    }

    /**
     * Clears any reconnect in progress.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._unmounted = true;

        clearInterval(this._lockUpdateInterval);
        clearTimeout(this._reconnectTimeout);
    }

    /**
     * Returns the props that should be passed into this loader's child
     * elements.
     *
     * @override
     */
    _getPropsForChildren() {
        return {
            remoteControlService
        };
    }

    /**
     * Establishes the connection to the remote control service.
     *
     * @override
     */
    _loadService() {
        const { lock, roomName } = this.props;

        if (!lock || !roomName) {
            logger.error(
                `Missing required field for login ${lock} ${roomName}`);

            this._redirectBackToLogin();

            return Promise.reject();
        }

        if (this._unmounted) {
            return Promise.reject();
        }

        return remoteControlService.connect({
            onDisconnect: () => {
                logger.error('Disconnected from the remote control service. '
                    + 'Will attempt reconnect');

                this._reconnect();
            },
            roomName,
            lock,
            serverConfig: this.props.remoteControlConfiguration
        })
        .then(() => {
            this._isReconnectQueued = false;
        })
        .catch(error => {
            logger.error(`Error connecting to remote control service: ${
                error}`);

            this._isReconnectQueued = false;

            remoteControlService.disconnect();

            // In the wrong password case return back to join code entry.
            if (error === 'not-authorized') {
                this.props.dispatch(
                    addNotification('error', 'Something went wrong'));

                this._redirectBackToLogin();

                return Promise.reject();
            }

            return this._reconnect();
        });
    }

    /**
     * Attempts to re-establish a previous connection to the remote control
     * service.
     *
     * @private
     * @returns {Promise}
     */
    _reconnect() {
        // Underneath remoteControlService, strophe can end up disconnecting
        // twice, and having two reconnects should be avoided.
        if (this._isReconnectQueued) {
            logger.warn('Reconnect called while already reconnecting');

            return Promise.reject();
        }

        if (this._unmounted) {
            logger.warn('Cancelling reconnect due to unmount');

            return Promise.reject();
        }

        if (this._reconnectCount > 3) {
            logger.warn(`Reconnect limit hit at ${this._reconnectCount}.`);

            this._redirectBackToLogin();

            return Promise.reject();
        }

        this._reconnectCount += 1;
        this._isReconnectQueued = true;

        // wait a little bit to retry to avoid a stampeding herd
        const jitter = Math.floor(Math.random() * 1500) + 500;

        logger.log(`Reconnect attempt number ${this._reconnectCount} in ${
            jitter}ms`);

        const jitterPromise = new Promise(resolve => {
            this._reconnectTimeout = setTimeout(() => {
                logger.log('Attempting reconnect');

                resolve();
            }, jitter);
        });

        const retryPromise = jitterPromise
            .then(() => remoteControlService.disconnect())
            .then(() => this._loadService())
            .then(() => {
                logger.log(
                    `Reconnected after ${this._reconnectCount} tries`);

                this._reconnectCount = 0;
            });

        return retryPromise;
    }

    /**
     * Changes routes to the join code entry view.
     *
     * @private
     * @returns {void}
     */
    _redirectBackToLogin() {
        this.props.history.push('/');
    }
}

/**
 * Selects parts of the Redux state to pass in with the props of
 * {@code RemoteControlLoader}.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        lock: getCurrentLock(state),
        remoteControlConfiguration: getRemoteControlServerConfig(state),
        roomName: getCurrentRoomName(state)
    };
}

const ConnectedRemoteControlLoader
    = withRouter(connect(mapStateToProps)(RemoteControlLoader));

export default generateWrapper(ConnectedRemoteControlLoader);
