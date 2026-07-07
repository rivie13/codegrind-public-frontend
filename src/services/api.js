import { getApiBaseUrl, getApiOrigin } from './api/base';
import { VmStartingError } from './api/fetcher';
import achievements from './api/endpoints/achievements';
import admin from './api/endpoints/admin';
import aiProblems from './api/endpoints/aiProblems';
import analysis from './api/endpoints/analysis';
import auth from './api/endpoints/auth';
import chat from './api/endpoints/chat';
import city from './api/endpoints/city';
import codeExecution from './api/endpoints/codeExecution';
import discord from './api/endpoints/discord';
import email from './api/endpoints/email';
import leaderboards from './api/endpoints/leaderboards';
import learningPath from './api/endpoints/learningPath';
import learningProblems from './api/endpoints/learningProblems';
import models from './api/endpoints/models';
import payments from './api/endpoints/payments';
import problems from './api/endpoints/problems';
import profile from './api/endpoints/profile';
import scores from './api/endpoints/scores';
import store from './api/endpoints/store';
import submissions from './api/endpoints/submissions';
import towerDefense from './api/endpoints/towerDefense';

export { getApiBaseUrl, getApiOrigin, VmStartingError };

export const api = {
  admin,
  analysis,
  discord,
  email,
  models,
  problems,
  scores,
  store,
  chat,
  city,
  codeExecution,
  submissions,
  auth,
  profile,
  payments,
  leaderboards,
  aiProblems,
  towerDefense,
  achievements,
  learningPath,
  learningProblems,
};

export default api;
