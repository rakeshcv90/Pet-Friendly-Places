import React from 'react';

import { Loader } from '../../../components/common/Loader';

// The app's paw loader card over a dimmed screen, shown while a photo uploads
export const UploadingOverlay = ({ visible, label = 'Uploading…' }) => (
  <Loader visible={visible} title={label} subtitle="" />
);
