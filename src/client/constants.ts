const PLUGIN_ID = "gainshark";

/** range of the part above 100%, stored by GainShark per volume key */
const MIN_BOOST = 100;
const MAX_BOOST = 200;

/** range of the one slider that scales every voice down together */
const MIN_MASTER = 0;
const MAX_MASTER = 100;

const STORAGE_KEY = "gainshark-settings";

export {
  MAX_BOOST,
  MAX_MASTER,
  MIN_BOOST,
  MIN_MASTER,
  PLUGIN_ID,
  STORAGE_KEY,
};
