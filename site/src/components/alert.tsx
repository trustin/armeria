import { Alert as AntdAlert } from 'antd';
import React from 'react';

interface AlertProps {
  type?: 'success' | 'info' | 'warning' | 'error';
  showIcon?: boolean;
  style?: React.CSSProperties;
  className?: string;
  icon?: React.ReactNode;
}

const Alert: React.FC<AlertProps> = props => (
  <AntdAlert
    type={props.type}
    showIcon={props.showIcon}
    style={props.style}
    className={props.className}
    icon={props.icon}
    message={<>{props.children}</>}
  />
);

const Tip: React.FC = ({ children }) => <Alert type="info">{children}</Alert>;
const Warning: React.FC = ({ children }) => (
  <Alert type="warning">{children}</Alert>
);

export { Alert, Tip, Warning };
