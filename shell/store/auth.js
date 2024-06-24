import { randomStr } from '@shell/utils/string';
import {MANAGEMENT} from "@shell/config/types";

const KEY = 'rc_nonce';
const ERR_NONCE = 'nonce';

export const LOGIN_ERRORS = {
  CLIENT:              'client',
  CLIENT_UNAUTHORIZED: 'client_unauthorized',
  SERVER:              'server'
};

export const state = function() {
  return {
    hasAuth:     null,
    loggedIn:    false,
    user: null,
    principalId: null,
  };
};

export const getters = {
  enabled(state) {
    return state.hasAuth;
  },

  user(state) {
    return state.user;
  },

  loggedIn(state) {
    return state.loggedIn;
  },

  principalId(state) {
    return state.principalId;
  },

};

export const mutations = {
  gotUser(state, user) {
    // Always deference to avoid race condition when setting `mustChangePassword`
    state.user = { ...user };
  },

  hasAuth(state, hasAuth) {
    state.hasAuth = !!hasAuth;
  },

  loggedInAs(state, principalId) {
    state.loggedIn = true;
    state.principalId = principalId;

    this.$cookies.remove(KEY);
  },

  loggedOut(state) {
    state.loggedIn = false;
    state.principalId = null;
  },
};

export const actions = {
  async getUser({ dispatch, commit, getters }) {
    if (getters.user) {
      return;
    }

    try {
      const user = await dispatch('management/findAll', {
        type: MANAGEMENT.USER,
        opt:  {
          url:    `/v1/${MANAGEMENT.USER}?me=true`,
        }
      }, { root: true });

      commit('gotUser', user?.[0]);
    } catch (err) {
      console.error('Error getting user', err);
    }
  },

  gotUser({ commit }, user) {
    commit('gotUser', user);
  },

  /**
   * Create the basic json object used for the nonce (this includes the random nonce/state)
   */
  createNonce(ctx, opt) {
    const out = { nonce: randomStr(16), to: 'vue' };

    if ( opt.test ) {
      out.test = true;
    }

    if (opt.provider) {
      out.provider = opt.provider;
    }

    return out;
  },

  async login({ dispatch }, { provider, body }) {
    try {
      await dispatch('management/request', {
        url:                  '/v1-public/auth?action=login',
        method:               'post',
        data:                 { ...body },
        headers:              { 'Content-Type': 'application/json' },
        redirectUnauthorized: false,
      }, { root: true, redirectUnauthorized: false });
      return;
    } catch (err) {
      if (err._status === 401) {
        return Promise.reject(LOGIN_ERRORS.CLIENT_UNAUTHORIZED);
      } else if (err.message) {
        return Promise.reject(err.message);
      } else if ( err._status >= 400 && err._status <= 499 ) {
        return Promise.reject(LOGIN_ERRORS.CLIENT);
      }

      return Promise.reject(LOGIN_ERRORS.SERVER);
    }
  },

  async logout({ dispatch, commit }) {
    // Unload plugins - we will load again on login
    await this.$plugin.logout();

    try {
      await dispatch('management/request', {
        url:                  '/v1-public/auth?action=logout',
        method:               'post',
        data:                 {},
        headers:              { 'Content-Type': 'application/json' },
        redirectUnauthorized: false,
      }, { root: true });
    } catch (e) {
    }

    commit('loggedOut');
    dispatch('onLogout', null, { root: true });
  }
};
