/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

this.MAIN_MESSAGE_TYPE = "ActivityStream:Main";
this.CONTENT_MESSAGE_TYPE = "ActivityStream:Content";
this.PRELOAD_MESSAGE_TYPE = "ActivityStream:PreloadedBrowser";
this.UI_CODE = 1;
this.BACKGROUND_PROCESS = 2;

/**
 * globalImportContext - Are we in UI code (i.e. react, a dom) or some kind of background process?
 *                       Use this in action creators if you need different logic
 *                       for ui/background processes.
 */
const globalImportContext = typeof Window === "undefined" ? BACKGROUND_PROCESS : UI_CODE;
// Export for tests
this.globalImportContext = globalImportContext;

// Create an object that avoids accidental differing key/value pairs:
// {
//   INIT: "INIT",
//   UNINIT: "UNINIT"
// }
const actionTypes = {};
for (const type of [
  "ADDONS_INFO_REQUEST",
  "ADDONS_INFO_RESPONSE",
  "AS_ROUTER_INITIALIZED",
  "AS_ROUTER_PREF_CHANGED",
  "AS_ROUTER_TARGETING_UPDATE",
  "BLOCK_URL",
  "BOOKMARK_URL",
  "COPY_DOWNLOAD_LINK",
  "DELETE_BOOKMARK_BY_ID",
  "DELETE_HISTORY_URL",
  "DIALOG_CANCEL",
  "DIALOG_OPEN",
  "DOWNLOAD_CHANGED",
  "FAKE_FOCUS_SEARCH",
  "FILL_SEARCH_TERM",
  "HANDOFF_SEARCH_TO_AWESOMEBAR",
  "HIDE_SEARCH",
  "INIT",
  "NEW_TAB_INIT",
  "NEW_TAB_INITIAL_STATE",
  "NEW_TAB_LOAD",
  "NEW_TAB_REHYDRATED",
  "NEW_TAB_STATE_REQUEST",
  "NEW_TAB_UNLOAD",
  "OPEN_DOWNLOAD_FILE",
  "OPEN_LINK",
  "OPEN_NEW_WINDOW",
  "OPEN_PRIVATE_WINDOW",
  "OPEN_WEBEXT_SETTINGS",
  "PLACES_BOOKMARK_ADDED",
  "PLACES_BOOKMARK_REMOVED",
  "PLACES_HISTORY_CLEARED",
  "PLACES_LINKS_CHANGED",
  "PLACES_LINK_BLOCKED",
  "PLACES_LINK_DELETED",
  "PREFS_INITIAL_VALUES",
  "PREF_CHANGED",
  "PREVIEW_REQUEST",
  "PREVIEW_REQUEST_CANCEL",
  "PREVIEW_RESPONSE",
  "REMOVE_DOWNLOAD_FILE",
  "RICH_ICON_MISSING",
  "SAVE_SESSION_PERF_DATA",
  "SCREENSHOT_UPDATED",
  "SECTION_DEREGISTER",
  "SECTION_DISABLE",
  "SECTION_ENABLE",
  "SECTION_MOVE",
  "SECTION_OPTIONS_CHANGED",
  "SECTION_REGISTER",
  "SECTION_UPDATE",
  "SECTION_UPDATE_CARD",
  "SETTINGS_CLOSE",
  "SETTINGS_OPEN",
  "SET_PREF",
  "SHOW_DOWNLOAD_FILE",
  "SHOW_FIREFOX_ACCOUNTS",
  "SHOW_SEARCH",
  "SKIPPED_SIGNIN",
  "SUBMIT_EMAIL",
  "SYSTEM_TICK",
  "TOP_SITES_CANCEL_EDIT",
  "TOP_SITES_CLOSE_SEARCH_SHORTCUTS_MODAL",
  "TOP_SITES_EDIT",
  "TOP_SITES_INSERT",
  "TOP_SITES_OPEN_SEARCH_SHORTCUTS_MODAL",
  "TOP_SITES_PIN",
  "TOP_SITES_PREFS_UPDATED",
  "TOP_SITES_UNPIN",
  "TOP_SITES_UPDATED",
  "TOTAL_BOOKMARKS_REQUEST",
  "TOTAL_BOOKMARKS_RESPONSE",
  "TRAILHEAD_ENROLL_EVENT",
  "UNINIT",
  "UPDATE_PINNED_SEARCH_SHORTCUTS",
  "UPDATE_SEARCH_SHORTCUTS",
  "UPDATE_SECTION_PREFS",
  "WEBEXT_CLICK",
  "WEBEXT_DISMISS",
]) {
  actionTypes[type] = type;
}

// These are acceptable actions for AS Router messages to have. They can show up
// as call-to-action buttons in snippets, onboarding tour, etc.
const ASRouterActions = {};
for (const type of [
  "INSTALL_ADDON_FROM_URL",
  "OPEN_APPLICATIONS_MENU",
  "OPEN_PRIVATE_BROWSER_WINDOW",
  "OPEN_URL",
  "OPEN_ABOUT_PAGE",
  "OPEN_PREFERENCES_PAGE",
  "SHOW_FIREFOX_ACCOUNTS",
  "PIN_CURRENT_TAB",
]) {
  ASRouterActions[type] = type;
}

// Helper function for creating routed actions between content and main
// Not intended to be used by consumers
function _RouteMessage(action, options) {
  const meta = action.meta ? {...action.meta} : {};
  if (!options || !options.from || !options.to) {
    throw new Error("Routed Messages must have options as the second parameter, and must at least include a .from and .to property.");
  }
  // For each of these fields, if they are passed as an option,
  // add them to the action. If they are not defined, remove them.
  ["from", "to", "toTarget", "fromTarget", "skipMain", "skipLocal"].forEach(o => {
    if (typeof options[o] !== "undefined") {
      meta[o] = options[o];
    } else if (meta[o]) {
      delete meta[o];
    }
  });
  return {...action, meta};
}

/**
 * AlsoToMain - Creates a message that will be dispatched locally and also sent to the Main process.
 *
 * @param  {object} action Any redux action (required)
 * @param  {object} options
 * @param  {bool}   skipLocal Used by OnlyToMain to skip the main reducer
 * @param  {string} fromTarget The id of the content port from which the action originated. (optional)
 * @return {object} An action with added .meta properties
 */
function AlsoToMain(action, fromTarget, skipLocal) {
  return _RouteMessage(action, {
    from: CONTENT_MESSAGE_TYPE,
    to: MAIN_MESSAGE_TYPE,
    fromTarget,
    skipLocal,
  });
}

/**
 * OnlyToMain - Creates a message that will be sent to the Main process and skip the local reducer.
 *
 * @param  {object} action Any redux action (required)
 * @param  {object} options
 * @param  {string} fromTarget The id of the content port from which the action originated. (optional)
 * @return {object} An action with added .meta properties
 */
function OnlyToMain(action, fromTarget) {
  return AlsoToMain(action, fromTarget, true);
}

/**
 * BroadcastToContent - Creates a message that will be dispatched to main and sent to ALL content processes.
 *
 * @param  {object} action Any redux action (required)
 * @return {object} An action with added .meta properties
 */
function BroadcastToContent(action) {
  return _RouteMessage(action, {
    from: MAIN_MESSAGE_TYPE,
    to: CONTENT_MESSAGE_TYPE,
  });
}

/**
 * AlsoToOneContent - Creates a message that will be will be dispatched to the main store
 *                    and also sent to a particular Content process.
 *
 * @param  {object} action Any redux action (required)
 * @param  {string} target The id of a content port
 * @param  {bool} skipMain Used by OnlyToOneContent to skip the main process
 * @return {object} An action with added .meta properties
 */
function AlsoToOneContent(action, target, skipMain) {
  if (!target) {
    throw new Error("You must provide a target ID as the second parameter of AlsoToOneContent. If you want to send to all content processes, use BroadcastToContent");
  }
  return _RouteMessage(action, {
    from: MAIN_MESSAGE_TYPE,
    to: CONTENT_MESSAGE_TYPE,
    toTarget: target,
    skipMain,
  });
}

/**
 * OnlyToOneContent - Creates a message that will be sent to a particular Content process
 *                    and skip the main reducer.
 *
 * @param  {object} action Any redux action (required)
 * @param  {string} target The id of a content port
 * @return {object} An action with added .meta properties
 */
function OnlyToOneContent(action, target) {
  return AlsoToOneContent(action, target, true);
}

/**
 * AlsoToPreloaded - Creates a message that dispatched to the main reducer and also sent to the preloaded tab.
 *
 * @param  {object} action Any redux action (required)
 * @return {object} An action with added .meta properties
 */
function AlsoToPreloaded(action) {
  return _RouteMessage(action, {
    from: MAIN_MESSAGE_TYPE,
    to: PRELOAD_MESSAGE_TYPE,
  });
}

function SetPref(name, value, importContext = globalImportContext) {
  const action = {type: actionTypes.SET_PREF, data: {name, value}};
  return importContext === UI_CODE ? AlsoToMain(action) : action;
}

function WebExtEvent(type, data, importContext = globalImportContext) {
  if (!data || !data.source) {
    throw new Error("WebExtEvent actions should include a property \"source\", the id of the webextension that should receive the event.");
  }
  const action = {type, data};
  return importContext === UI_CODE ? AlsoToMain(action) : action;
}

this.actionTypes = actionTypes;
this.ASRouterActions = ASRouterActions;

this.actionCreators = {
  BroadcastToContent,
  AlsoToOneContent,
  OnlyToOneContent,
  AlsoToMain,
  OnlyToMain,
  AlsoToPreloaded,
  SetPref,
  WebExtEvent,
};

// These are helpers to test for certain kinds of actions
this.actionUtils = {
  isSendToMain(action) {
    if (!action.meta) {
      return false;
    }
    return action.meta.to === MAIN_MESSAGE_TYPE && action.meta.from === CONTENT_MESSAGE_TYPE;
  },
  isBroadcastToContent(action) {
    if (!action.meta) {
      return false;
    }
    if (action.meta.to === CONTENT_MESSAGE_TYPE && !action.meta.toTarget) {
      return true;
    }
    return false;
  },
  isSendToOneContent(action) {
    if (!action.meta) {
      return false;
    }
    if (action.meta.to === CONTENT_MESSAGE_TYPE && action.meta.toTarget) {
      return true;
    }
    return false;
  },
  isSendToPreloaded(action) {
    if (!action.meta) {
      return false;
    }
    return action.meta.to === PRELOAD_MESSAGE_TYPE &&
      action.meta.from === MAIN_MESSAGE_TYPE;
  },
  isFromMain(action) {
    if (!action.meta) {
      return false;
    }
    return action.meta.from === MAIN_MESSAGE_TYPE &&
      action.meta.to === CONTENT_MESSAGE_TYPE;
  },
  getPortIdOfSender(action) {
    return (action.meta && action.meta.fromTarget) || null;
  },
  _RouteMessage,
};

const EXPORTED_SYMBOLS = [
  "actionTypes",
  "actionCreators",
  "actionUtils",
  "ASRouterActions",
  "globalImportContext",
  "UI_CODE",
  "BACKGROUND_PROCESS",
  "MAIN_MESSAGE_TYPE",
  "CONTENT_MESSAGE_TYPE",
  "PRELOAD_MESSAGE_TYPE",
];
