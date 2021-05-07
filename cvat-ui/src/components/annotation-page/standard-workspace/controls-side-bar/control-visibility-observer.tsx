// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="resize-observer-browser" />

import { SmallDashOutlined } from '@ant-design/icons';
import Popover from 'antd/lib/popover';
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

const extraControlsContentClassName = 'cvat-extra-controls-control-content';

let onUpdateChildren: Function | null = null;
export function ExtraControlsControl(): JSX.Element {
    const [hasChildren, setHasChildren] = useState(false);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
        }

        window.document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }, []);

    onUpdateChildren = () => {
        const contentElement = window.document.getElementsByClassName(extraControlsContentClassName)[0];
        if (contentElement) {
            setHasChildren(contentElement.children.length > 0);
        }
    };

    return (
        <Popover
            defaultVisible // we must render it at least one between using
            trigger={initialized ? 'hover' : 'click'} // trigger='hover' allows to close the popover by body click
            placement='right'
            overlayStyle={{ display: initialized ? '' : 'none' }}
            content={<div className={extraControlsContentClassName} />}
        >
            <SmallDashOutlined
                style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
                className='cvat-extra-controls-control cvat-antd-icon-control'
            />
        </Popover>
    );
}

export default function ControlVisibilityObserver<P = {}>(
    ControlComponent: React.FunctionComponent<P>,
): React.FunctionComponent<P> {
    let visibilityHeightThreshold = 0; // minimum value of height when element can be pushed to main panel

    return (props: P): JSX.Element | null => {
        const ref = useRef<HTMLDivElement>(null);
        const [visible, setVisible] = useState(true);

        useEffect(() => {
            if (ref && ref.current) {
                const wrapper = ref.current;
                const parentElement = ref.current.parentElement as HTMLElement;

                const reservedHeight = 45; // for itself
                const observer = new ResizeObserver(() => {
                    // when parent size was changed, check again can we put the control
                    // into the side panel or not
                    const availableHeight = parentElement.offsetHeight;
                    setVisible(availableHeight - reservedHeight >= visibilityHeightThreshold);
                });

                if (ref && ref.current) {
                    const availableHeight = parentElement.offsetHeight;
                    // when first mount, remember bottom coordinate which equal to minimum parent width
                    // to put the control into side panel
                    visibilityHeightThreshold = wrapper.offsetTop + wrapper.offsetHeight;
                    // start observing parent size
                    observer.observe(ref.current.parentElement as HTMLElement);
                    // then put it to extra controls if parent height is not enought
                    setVisible(availableHeight - reservedHeight >= visibilityHeightThreshold);
                }

                return () => {
                    observer.disconnect();
                };
            }

            return () => {};
        }, []);

        useEffect(() => {
            // when visibility changed, we notify extra content element because now its children changed
            if (onUpdateChildren) {
                onUpdateChildren();
            }
        }, [visible]);

        if (!visible) {
            const extraControlsContent = window.document.getElementsByClassName(extraControlsContentClassName)[0];
            if (extraControlsContent) {
                return ReactDOM.createPortal(<ControlComponent {...props} />, extraControlsContent);
            }

            return null;
        }

        // first mount always to side panel
        return (
            <div ref={ref}>
                <ControlComponent {...props} />
            </div>
        );
    };
}
