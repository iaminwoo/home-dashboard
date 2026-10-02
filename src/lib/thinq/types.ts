export type WashTowerApplianceStatus = {
  state: string | null;
  remainingMinutes: number | null;
};

export type WashTowerStatus = {
  washer: WashTowerApplianceStatus;
  dryer: WashTowerApplianceStatus;
  fetchedAt: string;
};

export type ThinQDevice = {
  deviceId: string;
  deviceInfo: {
    groupId: string | null;
    deviceType: string | null;
  };
};

export type WashTowerDevicePair = {
  groupId: string;
  washerDeviceId: string;
  dryerDeviceId: string;
  cachedAt: number;
};
