import _ from 'lodash';
import i18n from 'i18next';
import pubsub from 'pubsub-js';
import React from 'react';
import Select from 'react-select';
import classNames from 'classnames';
import PressAndHold from '../common/PressAndHold';
import Widget, { WidgetHeader, WidgetContent } from '../widget';
import socket from '../../socket';
import log from '../../lib/log';
import './axes.css';
import { ButtonGroup, DropdownButton, MenuItem, Glyphicon } from 'react-bootstrap';

const IMPERIAL_UNIT = 'inch';
const METRIC_UNIT = 'mm';

// mm/min (or inch/min)
const FEEDRATE_MIN = 0;
const FEEDRATE_MAX = 1000;
const FEEDRATE_STEP = 10;
const FEEDRATE_DEFAULT = 250;

// mm (or inch)
const DISTANCE_MIN = 0;
const DISTANCE_MAX = 1000;
const DISTANCE_STEP = 0.1;
const DISTANCE_DEFAULT = 1.00;

class DisplayPanel extends React.Component {
    state = {
        activeState: 'Idle', // Idle, Run, Hold, Door, Home, Alarm, Check
        machinePos: { // Machine position
            x: '0.000',
            y: '0.000',
            z: '0.000'
        },
        workingPos: { // Working position
            x: '0.000',
            y: '0.000',
            z: '0.000'
        }
    };
    static propTypes = {
        port: React.PropTypes.string
    }

    componentDidMount() {
        this.addSocketEvents();
    }
    componentWillUnmount() {
        this.removeSocketEvents();
    }
    addSocketEvents() {
        socket.on('grbl:current-status', ::this.socketOnGRBLCurrentStatus);
    }
    removeSocketEvents() {
        socket.off('grbl:current-status', ::this.socketOnGRBLCurrentStatus);
    }
    writeline() {
        let port = this.props.port;
        if ( ! port) {
            return;
        }

        let args = Array.prototype.slice.call(arguments);

        socket.emit.apply(socket, ['serialport:writeline', port].concat(args));
    }
    handleGoToZeroX() {
        this.writeline('G0 X0');
    }
    handleGoToZeroY() {
        this.writeline('G0 Y0');
    }
    handleGoToZeroZ() {
        this.writeline('G0 Z0');
    }
    handleZeroOutX() {
        this.writeline('G92 X0');
    }
    handleUnZeroOutX() {
        this.writeline('G92.1 X0');
    }
    handleZeroOutY() {
        this.writeline('G92 Y0');
    }
    handleUnZeroOutY() {
        this.writeline('G92.1 Y0');
    }
    handleZeroOutZ() {
        this.writeline('G92 Z0');
    }
    handleUnZeroOutZ() {
        this.writeline('G92.1 Z0');
    }
    socketOnGRBLCurrentStatus(data) {
        this.setState({
            activeState: data.activeState,
            machinePos: data.machinePos,
            workingPos: data.workingPos
        });
    }
    convertPositionUnit(pos) {
        pos = Number(pos);
        if (this.props.unit === METRIC_UNIT) {
            pos = (pos / 1).toFixed(3);
        } else {
            pos = (pos / 25.4).toFixed(4);
        }
        return '' + pos;
    }
    render() {
        let { unit } = this.props;
        let machinePos = _.mapValues(this.state.machinePos, (pos, axis) => {
            return this.convertPositionUnit(pos);
        }.bind(this));
        let workingPos = _.mapValues(this.state.workingPos, (pos, axis) => {
            return this.convertPositionUnit(pos);
        }.bind(this));

        return (
            <div className="container-fluid display-panel">
                <div className="row">
                    <table className="table-bordered">
                        <thead>
                            <tr>
                                <th>{i18n._('Axis')}</th>
                                <th>{i18n._('Machine Position')}</th>
                                <th>{i18n._('Working Position')}</th>
                                <th style={{textAlign: 'center'}}><i className="glyphicon glyphicon-list"></i></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="axis-label">
                                    X
                                </td>
                                <td className="axis-position">
                                    <span className="integer-part">{machinePos.x.split('.')[0]}</span>
                                    <span className="decimal-point">.</span>
                                    <span className="fractional-part">{machinePos.x.split('.')[1]}</span>
                                    <span className="dimension-unit">{unit}</span>
                                </td>
                                <td className="axis-position">
                                    <span className="integer-part">{workingPos.x.split('.')[0]}</span>
                                    <span className="decimal-point">.</span>
                                    <span className="fractional-part">{workingPos.x.split('.')[1]}</span>
                                    <span className="dimension-unit">{unit}</span>
                                </td>
                                <td className="axis-control">
                                    <DropdownButton bsSize="xs" bsStyle="default" title="" id="axis-x-dropdown" pullRight>
                                        <MenuItem onSelect={::this.handleGoToZeroX}>{i18n._('Go To Zero On X Axis (G0 X0)')}</MenuItem>
                                        <MenuItem onSelect={::this.handleZeroOutX}>{i18n._('Zero Out X Axis (G92 X0)')}</MenuItem>
                                        <MenuItem onSelect={::this.handleUnZeroOutX}>{i18n._('Un-Zero Out X Axis (G92.1 X0)')}</MenuItem>
                                    </DropdownButton>
                                </td>
                            </tr>
                            <tr>
                                <td className="axis-label">
                                    Y
                                </td>
                                <td className="axis-position">
                                    <span className="integer-part">{machinePos.y.split('.')[0]}</span>
                                    <span className="decimal-point">.</span>
                                    <span className="fractional-part">{machinePos.y.split('.')[1]}</span>
                                    <span className="dimension-unit">{unit}</span>
                                </td>
                                <td className="axis-position">
                                    <span className="integer-part">{workingPos.y.split('.')[0]}</span>
                                    <span className="decimal-point">.</span>
                                    <span className="fractional-part">{workingPos.y.split('.')[1]}</span>
                                    <span className="dimension-unit">{unit}</span>
                                </td>
                                <td className="axis-control">
                                    <DropdownButton bsSize="xs" bsStyle="default" title="" id="axis-y-dropdown" pullRight>
                                        <MenuItem onSelect={::this.handleGoToZeroY}>{i18n._('Go To Zero On Y Axis (G0 Y0)')}</MenuItem>
                                        <MenuItem onSelect={::this.handleZeroOutY}>{i18n._('Zero Out Y Axis (G92 Y0)')}</MenuItem>
                                        <MenuItem onSelect={::this.handleUnZeroOutY}>{i18n._('Un-Zero Out Y Axis (G92.1 Y0)')}</MenuItem>
                                    </DropdownButton>
                                </td>
                            </tr>
                            <tr>
                                <td className="axis-label">
                                    Z
                                </td>
                                <td className="axis-position">
                                    <span className="integer-part">{machinePos.z.split('.')[0]}</span>
                                    <span className="decimal-point">.</span>
                                    <span className="fractional-part">{machinePos.z.split('.')[1]}</span>
                                    <span className="dimension-unit">{unit}</span>
                                </td>
                                <td className="axis-position">
                                    <span className="integer-part">{workingPos.z.split('.')[0]}</span>
                                    <span className="decimal-point">.</span>
                                    <span className="fractional-part">{workingPos.z.split('.')[1]}</span>
                                    <span className="dimension-unit">{unit}</span>
                                </td>
                                <td className="axis-control">
                                    <DropdownButton bsSize="xs" bsStyle="default" title="" id="axis-z-dropdown" pullRight>
                                        <MenuItem onSelect={::this.handleGoToZeroZ}>{i18n._('Go To Zero On Z Axis (G0 Z0)')}</MenuItem>
                                        <MenuItem onSelect={::this.handleZeroOutZ}>{i18n._('Zero Out Z Axis (G92 Z0)')}</MenuItem>
                                        <MenuItem onSelect={::this.handleUnZeroOutZ}>{i18n._('Un-Zero Out Z Axis (G92.1 Z0)')}</MenuItem>
                                    </DropdownButton>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

class JogJoystickControl extends React.Component {
    static propTypes = {
        port: React.PropTypes.string,
        feedrate: React.PropTypes.number,
        distance: React.PropTypes.number
    };

    writeline() {
        let port = this.props.port;
        if ( ! port) {
            return;
        }

        let args = Array.prototype.slice.call(arguments);

        socket.emit.apply(socket, ['serialport:writeline', port].concat(args));
    }
    jogForwardX() {
        let msg = [
            'G91',
            'G1 F' + this.props.feedrate + ' X' + this.props.distance,
            'G90'
        ].join('\n');
        this.writeline(msg);
    }
    jogBackwardX() {
        let msg = [
            'G91',
            'G1 F' + this.props.feedrate + ' X-' + this.props.distance,
            'G90'
        ].join('\n');
        this.writeline(msg);
    }
    jogForwardY() {
        let msg = [
            'G91',
            'G1 F' + this.props.feedrate + ' Y' + this.props.distance,
            'G90'
        ].join('\n');
        this.writeline(msg);
    }
    jogBackwardY() {
        let msg = [
            'G91',
            'G1 F' + this.props.feedrate + ' Y-' + this.props.distance,
            'G90'
        ].join('\n');
        this.writeline(msg);
    }
    jogForwardZ() {
        let msg = [
            'G91',
            'G1 F' + this.props.feedrate + ' Z' + this.props.distance,
            'G90'
        ].join('\n');
        this.writeline(msg);
    }
    jogBackwardZ() {
        let msg = [
            'G91',
            'G1 F' + this.props.feedrate + ' Z-' + this.props.distance,
            'G90'
        ].join('\n');
        this.writeline(msg);
    }

    render() {
        return (
            <div>
                <table className="table-centered">
                    <tbody>
                        <tr>
                            <td className="jog-x">
                                <button type="button" className="btn btn-sm btn-default jog-x-minus" onClick={::this.jogBackwardX}>X-</button>
                            </td>
                            <td className="jog-y">
                                <div className="btn-group-vertical">
                                    <button type="button" className="btn btn-sm btn-default jog-y-plus" onClick={::this.jogForwardY}>Y+<i className="icon ion-arrow-up"></i></button>
                                    <button type="button" className="btn btn-sm btn-default jog-y-minus" onClick={::this.jogBackwardY}>Y-<i className="icon ion-arrow-down"></i></button>
                                </div>
                            </td>
                            <td className="jog-x">
                                <button type="button" className="btn btn-sm btn-default jog-x-plus" onClick={::this.jogForwardX}>X+</button>
                            </td>
                            <td className="jog-z">
                                <div className="btn-group-vertical">
                                    <button type="button" className="btn btn-sm btn-default jog-z-plus" onClick={::this.jogForwardZ}>Z+</button>
                                    <button type="button" className="btn btn-sm btn-default jog-z-minus" onClick={::this.jogBackwardZ}>Z-</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

class JogFeedrateControl extends React.Component {
    state = {
        feedrate: FEEDRATE_DEFAULT
    }
    static propTypes = {
        onChange: React.PropTypes.func
    };

    normalizeToRange(n, min, max) {
        return Math.min(Math.max(Number(n), min), max);
    }
    handleChange(event) {
        let feedrate = event.target.value;
        this.setState({ feedrate: feedrate });
        this.props.onChange(feedrate);
    }
    increaseFeedrate() {
        let feedrate = Math.min(Number(this.state.feedrate) + FEEDRATE_STEP, FEEDRATE_MAX);
        this.setState({ feedrate: feedrate });
        this.props.onChange(feedrate);
    }
    decreaseFeedrate() {
        let feedrate = Math.max(Number(this.state.feedrate) - FEEDRATE_STEP, FEEDRATE_MIN);
        this.setState({ feedrate: feedrate });
        this.props.onChange(feedrate);
    }
    resetFeedrate() {
        let feedrate = FEEDRATE_DEFAULT;
        this.setState({ feedrate: feedrate });
        this.props.onChange(feedrate);
    }

    render() {
        let feedrate = this.normalizeToRange(this.state.feedrate, FEEDRATE_MIN, FEEDRATE_MAX);

        return (
            <div className="form-group">
                <label className="control-label">
                    {i18n._('Feed rate (mm/min):')}
                </label>
                <div className="input-group input-group-xs">
                    <div className="input-group-btn">
                        <input
                            type="number"
                            className="form-control"
                            style={{width: 80}}
                            min={FEEDRATE_MIN}
                            max={FEEDRATE_MAX}
                            step={FEEDRATE_STEP}
                            value={feedrate}
                            onChange={::this.handleChange}
                        />
                        <PressAndHold className="btn btn-default" onClick={::this.increaseFeedrate}>
                            <span className="glyphicon glyphicon-plus"></span>
                        </PressAndHold>
                        <PressAndHold className="btn btn-default" onClick={::this.decreaseFeedrate}>
                            <span className="glyphicon glyphicon-minus"></span>
                        </PressAndHold>
                        <button type="button" className="btn btn-default" onClick={::this.resetFeedrate} title={i18n._('Reset')}>
                            <span className="glyphicon glyphicon-reset"></span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

class JogDistanceControl extends React.Component {
    state = {
        distance: DISTANCE_DEFAULT
    };
    static propTypes = {
        onChange: React.PropTypes.func
    };

    normalizeToRange(n, min, max) {
        return Math.min(Math.max(Number(n), min), max);
    }
    handleChange(event) {
        let distance = event.target.value;
        this.setState({ distance: distance });
        this.props.onChange(distance);
    }
    increaseDistance() {
        let distance = Math.min(Number(this.state.distance) + DISTANCE_STEP, DISTANCE_MAX);
        this.setState({ distance: distance.toFixed(2) });
        this.props.onChange(distance);
    }
    decreaseDistance() {
        let distance = Math.max(Number(this.state.distance) - DISTANCE_STEP, DISTANCE_MIN);
        this.setState({ distance: distance.toFixed(2) });
        this.props.onChange(distance);
    }
    resetDistance() {
        let distance = DISTANCE_DEFAULT;
        this.setState({ distance: distance });
        this.props.onChange(distance);
    }
    render() {
        let distance = this.normalizeToRange(this.state.distance, DISTANCE_MIN, DISTANCE_MAX);

        return (
            <div className="form-group">
                <label className="control-label">
                    {i18n._('Distance (mm):')}
                </label>
                <div className="input-group input-group-xs">
                    <div className="input-group-btn">
                        <input
                            type="number"
                            className="form-control"
                            style={{width: 80}}
                            min={DISTANCE_MIN}
                            max={DISTANCE_MAX}
                            step={DISTANCE_STEP}
                            value={distance}
                            onChange={::this.handleChange}
                        />
                        <PressAndHold className="btn btn-default" onClick={::this.increaseDistance}>
                            <span className="glyphicon glyphicon-plus"></span>
                        </PressAndHold>
                        <PressAndHold className="btn btn-default" onClick={::this.decreaseDistance}>
                            <span className="glyphicon glyphicon-minus"></span>
                        </PressAndHold>
                        <button type="button" className="btn btn-default" onClick={::this.resetDistance} title={i18n._('Reset')}>
                            <span className="glyphicon glyphicon-reset"></span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

class JogControlPanel extends React.Component {
    state = {
        distance: DISTANCE_DEFAULT,
        feedrate: FEEDRATE_DEFAULT
    };
    static propTypes = {
        port: React.PropTypes.string
    };

    changeFeedrate(feedrate) {
        this.setState({ feedrate: feedrate });
    }
    changeDistance(distance) {
        this.setState({ distance: distance });
    }
    writeline() {
        let port = this.props.port;
        if ( ! port) {
            return;
        }

        let args = Array.prototype.slice.call(arguments);

        socket.emit.apply(socket, ['serialport:writeline', port].concat(args));
    }
    handleGoToZero() {
        this.writeline('G0 X0 Y0 Z0');
    }
    handleZeroOut() {
        this.writeline('G92 X0 Y0 Z0');
    }
    handleUnZeroOut() {
        this.writeline('G92.1 X0 Y0 Z0');
    }
    // experimental feature
    handleToggleUnit() {
        let unit;

        if (this.props.unit === METRIC_UNIT) {
            unit = IMPERIAL_UNIT;
            
            //this.writeline('G20'); // G20 specifies Imperial (inch) unit
        } else {
            unit = METRIC_UNIT;

            //this.writeline('G21'); // G21 specifies Metric (mm) unit
        }
        this.props.changeDisplayUnit(unit);
    }
    // TBD
    handleHomingSequence() {
    }
    render() {
        let { port } = this.props;
        let { feedrate, distance } = this.state;

        return (
            <div className="container-fluid control-panel">
                <div className="row">
                    <div className="col-sm-6">
                        <JogJoystickControl port={port} feedrate={feedrate} distance={distance} />
                    </div>
                    <div className="col-sm-6">
                        <ButtonGroup bsSize="xs" vertical>
                            <button type="button" className="btn btn-xs btn-default" onClick={::this.handleGoToZero}>{i18n._('Go To Zero (G0)')}</button>
                            <button type="button" className="btn btn-xs btn-default" onClick={::this.handleZeroOut}>{i18n._('Zero Out (G92)')}</button>
                            <button type="button" className="btn btn-xs btn-default" onClick={::this.handleUnZeroOut}>{i18n._('Un-Zero Out (G92.1)')}</button>
                        </ButtonGroup>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-6">
                        <JogDistanceControl onChange={::this.changeDistance} />
                    </div>
                    <div className="col-sm-6">
                        <JogFeedrateControl onChange={::this.changeFeedrate} />
                    </div>
                </div>
            </div>
        );
    }
}

class Axes extends React.Component {
    state = {
        port: '',
        unit: METRIC_UNIT,
        isCollapsed: false
    };

    componentDidMount() {
        this.subscribe();
    }
    componentWillUnmount() {
        this.unsubscribe();
    }
    subscribe() {
        let that = this;

        this.pubsubTokens = [];

        { // port
            let token = pubsub.subscribe('port', (msg, port) => {
                port = port || '';
                that.setState({ port: port });
            });
            this.pubsubTokens.push(token);
        }
    }
    unsubscribe() {
        _.each(this.pubsubTokens, (token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }
    toggleDisplayUnit() {
        let unit;

        if (this.state.unit === METRIC_UNIT) {
            unit = IMPERIAL_UNIT;
            
            //this.writeline('G20'); // G20 specifies Imperial (inch) unit
        } else {
            unit = METRIC_UNIT;

            //this.writeline('G21'); // G21 specifies Metric (mm) unit
        }
        this.setState({ unit: unit });
    }
    toggleExpandCollapse() {
        this.setState({
            isCollapsed: ! this.state.isCollapsed
        });
    }
    render() {
        let { port, unit, isCollapsed } = this.state;
        let classes = {
            icon: classNames(
                'glyphicon',
                { 'glyphicon-chevron-up': ! isCollapsed },
                { 'glyphicon-chevron-down': isCollapsed }
            )
        };
        let style = {
            padding: 0
        };

        return (
            <div style={style}>
                <div className="clearfix" style={{padding: '0 10px'}}>
                    <div className="pull-right">
                        <ButtonGroup bsSize="xs">
                            <button type="button" className="btn btn-xs btn-default" onClick={::this.toggleDisplayUnit}>{i18n._('in / mm')}</button>
                        </ButtonGroup>
                    </div>
                </div>

                <DisplayPanel port={port} unit={unit} />

                <div className="container-fluid">
                    <div className="row">
                        <div className="toggle-expand-collapse noselect" onClick={::this.toggleExpandCollapse}>
                            <i className={classes.icon}></i>
                        </div>
                    </div>
                </div>

                {! isCollapsed &&
                <JogControlPanel port={port} unit={unit} />
                }
            </div>
        );
    }
}

export default class AxesWidget extends React.Component {
    state = {
        isCollapsed: false
    };

    handleClick(target, val) {
        if (target === 'toggle') {
            this.setState({
                isCollapsed: !!val
            });
        }
    }
    render() {
        let width = 360;
        let title = (
            <div><i className="glyphicon glyphicon-move"></i>{i18n._('Axes')}</div>
        );
        let toolbarButtons = [
            'toggle'
        ];
        let widgetContentClass = classNames(
            { 'hidden': this.state.isCollapsed }
        );

        return (
            <div data-component="Widgets/AxesWidget">
                <Widget width={width}>
                    <WidgetHeader
                        title={title}
                        toolbarButtons={toolbarButtons}
                        handleClick={::this.handleClick}
                    />
                    <WidgetContent className={widgetContentClass}>
                        <Axes />
                    </WidgetContent>
                </Widget>
            </div>
        );
    }
}
