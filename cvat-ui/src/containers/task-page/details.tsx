import React from 'react';
import { connect } from 'react-redux';

import DetailsComponent from '../../components/task-page/details';
import { CombinedState } from '../../reducers/root-reducer';
import { updateTaskAsync } from '../../actions/tasks-actions';
import { Task } from '../../reducers/interfaces';

interface OwnProps {
    task: Task;
}

interface StateToProps {
    registeredUsers: any[];
    installedGit: boolean;
}

interface DispatchToProps {
    onTaskUpdate: (taskInstance: any) => void;
}

function mapStateToProps(state: CombinedState, own: OwnProps): StateToProps {
    const { plugins } = state.plugins;

    return {
        registeredUsers: state.users.users,
        installedGit: plugins.GIT_INTEGRATION,
    };
}


function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        onTaskUpdate: (taskInstance: any) =>
            dispatch(updateTaskAsync(taskInstance))
    }
}


function TaskPageContainer(props: StateToProps & DispatchToProps & OwnProps) {
    return (
        <DetailsComponent
            previewImage={props.task.preview}
            taskInstance={props.task.instance}
            installedGit={props.installedGit}
            onTaskUpdate={props.onTaskUpdate}
            registeredUsers={props.registeredUsers}
        />
    );
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TaskPageContainer);