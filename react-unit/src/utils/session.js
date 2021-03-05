'use strict';
const md5 = require('md5')

const LOCAL_MD5 = md5(window.location.hostname);
const AUTH_TOKEN = LOCAL_MD5 + '_msp_auth_'
const AUTH_TYPE = LOCAL_MD5 + '_auth_type_'
const LOGIN_COOKIE_REM = '_msp_session_rem_'
const LOGIN_COOKIE_NAME = '_msp_session_id_';
const LOGIN_COOKIE_PASS = '_msp_session_psd_';
const UNLOGIN_COOKIE_PASS = '_msp_nologin_flag_';

export const isAuth = () => {
  return getToken();
}

export const setUser = name => {
  name ?
    _setCookie(LOGIN_COOKIE_NAME, window.btoa(name)) :
    _setCookie(LOGIN_COOKIE_NAME, '', 0);
}

export const getUser = () => {
  return window.atob(_getCookie(LOGIN_COOKIE_NAME))
}

export const setPass = psd => {
  psd ? 
  _setCookie(LOGIN_COOKIE_PASS, window.btoa(psd)) : 
  _setCookie(LOGIN_COOKIE_PASS, '', 0)
}

export const getPass = () => {
  return window.atob(_getCookie(LOGIN_COOKIE_PASS))
}

export const setRem = r => {
  r ? 
  _setCookie(LOGIN_COOKIE_REM, window.btoa(r)) :
  _setCookie(LOGIN_COOKIE_REM, '', 0)
}

export const getRem = () => {
  return window.atob(_getCookie(LOGIN_COOKIE_REM))
}

export const setToken = token => {
  token ?
    window.localStorage.setItem(AUTH_TOKEN, token) :
    window.localStorage.removeItem(AUTH_TOKEN)
}

export const getToken = () => {
  return window.localStorage.getItem(AUTH_TOKEN);
}

export const setAuthType = type => {
  window.localStorage.setItem(AUTH_TYPE, type)
}

export const getAuthType = () => {
  return window.localStorage.getItem(AUTH_TYPE)
}

export const setUnlogin = nologin => {
  window.localStorage.setItem(UNLOGIN_COOKIE_PASS, nologin)
}

export const getUnlogin = () => {
  return window.localStorage.getItem(UNLOGIN_COOKIE_PASS)
}

const _getCookie = name => {
  let start, end;
  if (document.cookie.length > 0) {
    start = document.cookie.indexOf(name + '=');
    if (start !== -1) {
      start = start + name.length + 1;
      end = document.cookie.indexOf(';', start);
      if (end === -1) {
        end = document.cookie.length;
      }
      return unescape(document.cookie.substring(start, end));
    }
  }
  return '';
}

const _setCookie = (name, value, expire) => {
  let date = new Date();
  date.setDate(date.getDate() + expire);
  document.cookie =
    name +
    '=' +
    escape(value) +
    '; path=/; samesite=strict' +
    (expire ? ';expires=' + date.toGMTString() : '');
}
