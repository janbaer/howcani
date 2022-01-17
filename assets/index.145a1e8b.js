var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import { w as writable, S as StatusCodes, g as get_store_value, a as SvelteComponent, i as init, s as safe_not_equal, m as marked, e as element, b as attr, c as insert, n as noop, d as detach, C as Card, f as create_component, h as mount_component, t as transition_in, j as transition_out, k as destroy_component, l as createEventDispatcher, o as CardTitle, p as CardText, q as CardActions, r as space, u as formatISO9075, v as text, x as append, y as listen, z as group_outros, A as check_outros, B as set_data, R as Row, D as Col, I as Icon, E as mdiHelp, F as mdiCheck, G as mdiTag, H as set_style, J as empty, K as destroy_each, L as mdiUpdate, P as ProgressCircular, M as mdiPencil, N as toggle_class, O as onMount, Q as Editor_1, T as Dialog, U as TextField, V as binding_callbacks, W as bind, X as add_flush_callback, Y as Checkbox, Z as Tags, _ as Button, $ as action_destroyer, a0 as run_all, a1 as update_keyed_each, a2 as outro_and_destroy_block, a3 as bubble, a4 as mdiTrashCan, a5 as List, a6 as ListItem, a7 as NavigationDrawer, a8 as Overlay, a9 as get_spread_update, aa as get_spread_object, ab as component_subscribe, ac as globals, ad as AppBar, ae as assign, af as push, ag as mdiMagnify, ah as mdiNotePlusOutline, ai as mdiGithub, aj as mdiMenu, ak as prevent_default, al as querystring, am as replace, an as MaterialApp, ao as Router, ap as Footer } from "./vendor.053c1c6b.js";
const p = function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(script) {
    const fetchOpts = {};
    if (script.integrity)
      fetchOpts.integrity = script.integrity;
    if (script.referrerpolicy)
      fetchOpts.referrerPolicy = script.referrerpolicy;
    if (script.crossorigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (script.crossorigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
};
p();
const defaultConfig = { user: "", repository: "" };
let storedConfig = JSON.parse(localStorage.getItem("config"));
const configStore = writable(storedConfig || defaultConfig);
configStore.subscribe((config) => {
  localStorage.setItem("config", JSON.stringify(config));
});
class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
const GITHUB_ROOT_URL = "https://api.github.com";
class GithubService {
  constructor(user, repository, oauthToken) {
    this.user = user;
    this.repository = repository;
    this.oauthToken = oauthToken;
  }
  _buildQueryString(searchTerm, page, perPage, sort = "created", order = "desc") {
    const searchParams = new Map();
    searchParams.set("q", searchTerm);
    searchParams.set("sort", sort);
    searchParams.set("direction", order);
    if (page) {
      searchParams.set("page", page);
      searchParams.set("per_page", perPage);
    }
    let query = "";
    for (const [key, value] of searchParams.entries()) {
      if (query.length > 0) {
        query += "&";
      }
      query += `${key}=${value}`;
    }
    return query;
  }
  _buildRequestOptions(method, oauthToken) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if (oauthToken) {
      headers.append("Authorization", `token ${oauthToken}`);
    }
    return {
      method,
      headers
    };
  }
  async _fetch(path, requestOptions) {
    let url = `${GITHUB_ROOT_URL}${path}`;
    const response = await fetch(url, requestOptions);
    switch (response.status) {
      case StatusCodes.OK:
      case StatusCodes.CREATED:
        return response.json();
      case StatusCodes.NO_CONTENT:
        return void 0;
      case StatusCodes.UNAUTHORIZED:
        throw new UnauthorizedError();
      default:
        throw new Error(`Unexpected error with status code ${response.status}`);
    }
  }
  _get(path) {
    const requestOptions = this._buildRequestOptions("GET", this.oauthToken);
    return this._fetch(path, requestOptions);
  }
  _patch(path, body) {
    const requestOptions = this._buildRequestOptions("PATCH", this.oauthToken);
    requestOptions.body = JSON.stringify(body);
    return this._fetch(path, requestOptions);
  }
  _post(path, body) {
    const requestOptions = this._buildRequestOptions("POST", this.oauthToken);
    requestOptions.body = JSON.stringify(body);
    return this._fetch(path, requestOptions);
  }
  _delete(path) {
    const requestOptions = this._buildRequestOptions("DELETE", this.oauthToken);
    return this._fetch(path, requestOptions);
  }
  getLabels() {
    return this._get(`/repos/${this.user}/${this.repository}/labels?per_page=100`);
  }
  updateLabel(originalName, newName, newColor) {
    const patch = {
      new_name: newName,
      color: newColor.substr(1)
    };
    return this._patch(`/repos/${this.user}/${this.repository}/labels/${encodeURIComponent(originalName)}`, patch);
  }
  deleteLabel(labelName) {
    return this._delete(`/repos/${this.user}/${this.repository}/labels/${encodeURIComponent(labelName)}`);
  }
  async getUser(username) {
    try {
      const user = await this._get(`/users/${username}`);
      return user;
    } catch (err) {
      console.error(`Github user ${username} does not exist`);
      return void 0;
    }
  }
  async getAuthenticatedUser(oauthToken) {
    this.oauthToken = oauthToken;
    const user = await this._get("/user");
    if (user) {
      const { avatar_url, email, login, name } = user;
      return {
        avatarUrl: avatar_url,
        email,
        loginName: login,
        userName: name
      };
    }
    return void 0;
  }
  getUserRepositories(oauthToken) {
    this.oauthToken = oauthToken;
    return this._get("/user/repos?per_page=100");
  }
  async getRepository(username, repositoryName) {
    try {
      const repository = await this._get(`/repos/${username}/${repositoryName}`);
      return repository;
    } catch (err) {
      console.error(`Github repository ${repositoryName} for user ${username} does not exist`);
      return void 0;
    }
  }
  async searchIssues(searchString, page, perPage) {
    const queryString = this._buildQueryString(searchString, page, perPage);
    const issues = await this._get(`/search/issues?${queryString}`);
    return issues;
  }
  postIssue(issue) {
    return this._post(`/repos/${this.user}/${this.repository}/issues`, issue);
  }
  patchIssue(issueNumber, patch) {
    return this._patch(`/repos/${this.user}/${this.repository}/issues/${issueNumber}`, patch);
  }
}
const labelsStore = writable([]);
function _mapLabel(label) {
  return {
    id: label.id,
    name: label.name,
    color: `#${label.color}`
  };
}
async function loadLabels(config) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);
  const labels = await githubService.getLabels();
  labelsStore.set(labels.map(_mapLabel));
}
async function updateLabel(config, label) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);
  const labels = get_store_value(labelsStore);
  const originalLabel = labels.find((l) => l.id === label.id);
  await githubService.updateLabel(originalLabel.name, label.name, label.color);
  loadLabels(config);
}
async function deleteLabel(config, label) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);
  await githubService.deleteLabel(label.name);
  loadLabels(config);
}
function replaceQuestion(questions, oldQuestion, newQuestion) {
  const index = questions.findIndex((q) => q.id === oldQuestion.id);
  if (index >= 0) {
    questions[index] = newQuestion;
  }
  return questions;
}
class QuestionService {
  constructor(githubService, searchQueryBuilderService) {
    this.github = githubService;
    this.searchQueryBuilder = searchQueryBuilderService;
  }
  async fetchQuestions(searchQuery, page = 1, perPage = 50) {
    const searchString = this.searchQueryBuilder.buildQueryString(searchQuery);
    const response = await this.github.searchIssues(searchString, page, perPage);
    return {
      questions: response.items.map(this._mapIssueToQuestion.bind(this)),
      totalCount: response.total_count
    };
  }
  filterItemsByLockedState(items) {
    return items.filter((item) => item.locked === false);
  }
  fetchQuestion(id) {
    return this.github.getIssue(id);
  }
  async createQuestion(question) {
    let issue = this._mapIssueFromQuestion(question);
    delete issue.state;
    issue = await this.github.postIssue(issue);
    if (question.isAnswered) {
      issue = await this.github.patchIssue(issue.number, {
        state: this._mapState(question.isAnswered)
      });
    }
    return this._mapIssueToQuestion(issue);
  }
  async updateQuestion(question) {
    const issue = await this.github.patchIssue(question.number, this._mapIssueFromQuestion(question));
    return this._mapIssueToQuestion(issue);
  }
  _mapIssueFromQuestion(question) {
    return {
      title: question.title,
      body: question.body,
      labels: question.labels.map((label) => label.name),
      state: this._mapState(question.isAnswered)
    };
  }
  _mapIssueToQuestion(issue) {
    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      isAnswered: issue.state === "closed",
      user: this._mapUser(issue.user),
      created: issue.created_at,
      modified: issue.modified_at,
      closed: issue.closed_at,
      labels: issue.labels.map(this._mapLabel)
    };
  }
  _mapLabel(label) {
    return {
      name: label.name,
      color: label.color
    };
  }
  _mapUser(user) {
    return {
      login: user.login,
      avatarUrl: user.avatar_url
    };
  }
  _mapState(isAnswered) {
    return isAnswered ? "closed" : "open";
  }
}
class SearchQueryBuilderService {
  constructor(user, repository) {
    this.user = user;
    this.repository = repository;
  }
  buildQueryString(searchQuery = {}) {
    const query = [];
    if (searchQuery.query) {
      query.push(searchQuery.query.replace(/\s/g, "+"));
    }
    if (searchQuery.labels && searchQuery.labels.length > 0) {
      query.push(searchQuery.labels.map((label) => `label:${label}`).join("+"));
    }
    if (searchQuery.state) {
      query.push(`state:${searchQuery.state}`);
    }
    if (searchQuery.onlyMyQuestions && this.user) {
      query.push(`author:${this.user}`);
    }
    query.push(`repo:${this.user}/${this.repository}`);
    query.push("type:issue");
    return query.join("+");
  }
}
const QUESTIONS_PER_PAGE = 10;
const questionsStore = writable({
  questions: [],
  page: 1,
  hasMoreData: true,
  loading: false,
  searchQuery: {
    query: "",
    state: "",
    labels: []
  }
});
async function loadQuestions(config, searchQuery, page) {
  let { questions, loading, hasMoreData } = get_store_value(questionsStore);
  if (loading) {
    return;
  }
  if (page === 1) {
    questions = [];
    hasMoreData = true;
  }
  loading = true;
  questionsStore.update((current) => {
    return __spreadProps(__spreadValues({}, current), { searchQuery, loading });
  });
  if (!hasMoreData) {
    return;
  }
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);
  const searchQueryBuilderService = new SearchQueryBuilderService(user, repository);
  const questionService = new QuestionService(githubService, searchQueryBuilderService);
  const questionsResponse = await questionService.fetchQuestions(searchQuery, page, QUESTIONS_PER_PAGE);
  loading = false;
  hasMoreData = questionsResponse.questions.length > 0;
  questions = [...questions, ...questionsResponse.questions];
  questionsStore.set({ questions, searchQuery, page, hasMoreData, loading });
}
async function createQuestion(config, question) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);
  const questionService = new QuestionService(githubService);
  const newQuestion = await questionService.createQuestion(question);
  questionsStore.update((current) => {
    const questions = [newQuestion, ...current.questions];
    return __spreadProps(__spreadValues({}, current), { questions });
  });
  loadLabels(config);
}
async function updateQuestion(config, question) {
  const { user, repository, oauthToken } = config;
  const githubService = new GithubService(user, repository, oauthToken);
  const questionService = new QuestionService(githubService);
  let { questions } = get_store_value(questionsStore);
  const updatedQuestion = await questionService.updateQuestion(question);
  questions = replaceQuestion(questions, question, updatedQuestion);
  questionsStore.update((current) => {
    return __spreadProps(__spreadValues({}, current), { questions });
  });
  loadLabels(config);
}
const toggleSidebarStore = writable(false);
function isTabletOrDesktopSize() {
  return window.matchMedia("(min-width: 1024px)").matches;
}
function isMinIPadPortraitSize() {
  return window.matchMedia("(min-width: 768px)").matches;
}
let intersectionObserver;
function ensureIntersectionObserver() {
  if (intersectionObserver)
    return;
  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const eventName = entry.isIntersecting ? "enterViewport" : "exitViewport";
      entry.target.dispatchEvent(new CustomEvent(eventName));
    });
  });
}
function viewport(element2) {
  ensureIntersectionObserver();
  intersectionObserver.observe(element2);
  return {
    destroy() {
      intersectionObserver.unobserve(element2);
    }
  };
}
var githubMarkdown = "";
function create_fragment$e(ctx) {
  let div;
  let raw_value = marked(ctx[0]) + "";
  return {
    c() {
      div = element("div");
      attr(div, "class", "markdown-body");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      div.innerHTML = raw_value;
    },
    p(ctx2, [dirty]) {
      if (dirty & 1 && raw_value !== (raw_value = marked(ctx2[0]) + ""))
        div.innerHTML = raw_value;
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function instance$d($$self, $$props, $$invalidate) {
  let { content = "" } = $$props;
  $$self.$$set = ($$props2) => {
    if ("content" in $$props2)
      $$invalidate(0, content = $$props2.content);
  };
  return [content];
}
class Markdown_view extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$d, create_fragment$e, safe_not_equal, { content: 0 });
  }
}
var question_svelte_svelte_type_style_lang = "";
function get_each_context$2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[4] = list[i];
  return child_ctx;
}
function create_else_block$2(ctx) {
  let icon;
  let current;
  icon = new Icon({
    props: {
      path: mdiHelp,
      size: "24px",
      class: "red-text"
    }
  });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function create_if_block$6(ctx) {
  let icon;
  let current;
  icon = new Icon({
    props: {
      path: mdiCheck,
      size: "24px",
      class: "green-text"
    }
  });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function create_default_slot_6$3(ctx) {
  let h3;
  let current_block_type_index;
  let if_block;
  let t0;
  let span;
  let t1_value = ctx[0].title + "";
  let t1;
  let current;
  let mounted;
  let dispose;
  const if_block_creators = [create_if_block$6, create_else_block$2];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[0].isAnswered)
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      h3 = element("h3");
      if_block.c();
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      attr(h3, "class", "svelte-1jt171z");
    },
    m(target, anchor) {
      insert(target, h3, anchor);
      if_blocks[current_block_type_index].m(h3, null);
      append(h3, t0);
      append(h3, span);
      append(span, t1);
      current = true;
      if (!mounted) {
        dispose = listen(h3, "click", ctx[1]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        transition_in(if_block, 1);
        if_block.m(h3, t0);
      }
      if ((!current || dirty & 1) && t1_value !== (t1_value = ctx2[0].title + ""))
        set_data(t1, t1_value);
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(h3);
      if_blocks[current_block_type_index].d();
      mounted = false;
      dispose();
    }
  };
}
function create_default_slot_5$3(ctx) {
  let div;
  let markdownview;
  let current;
  markdownview = new Markdown_view({
    props: { content: ctx[0].body }
  });
  return {
    c() {
      div = element("div");
      create_component(markdownview.$$.fragment);
      attr(div, "class", "Question-body");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(markdownview, div, null);
      current = true;
    },
    p(ctx2, dirty) {
      const markdownview_changes = {};
      if (dirty & 1)
        markdownview_changes.content = ctx2[0].body;
      markdownview.$set(markdownview_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(markdownview.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(markdownview.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(markdownview);
    }
  };
}
function create_each_block$2(ctx) {
  let span;
  let t_value = ctx[4].name + "";
  let t;
  return {
    c() {
      span = element("span");
      t = text(t_value);
      attr(span, "class", "Question-label svelte-1jt171z");
      set_style(span, "color", "#" + ctx[4].color);
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & 1 && t_value !== (t_value = ctx2[4].name + ""))
        set_data(t, t_value);
      if (dirty & 1) {
        set_style(span, "color", "#" + ctx2[4].color);
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_default_slot_4$4(ctx) {
  let icon;
  let t;
  let each_1_anchor;
  let current;
  icon = new Icon({
    props: {
      path: mdiTag,
      size: "24px",
      class: "orange-text"
    }
  });
  let each_value = ctx[0].labels;
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
  }
  return {
    c() {
      create_component(icon.$$.fragment);
      t = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      insert(target, t, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }
      insert(target, each_1_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if (dirty & 1) {
        each_value = ctx2[0].labels;
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$2(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$2(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
      if (detaching)
        detach(t);
      destroy_each(each_blocks, detaching);
      if (detaching)
        detach(each_1_anchor);
    }
  };
}
function create_default_slot_3$5(ctx) {
  let icon;
  let t0;
  let span;
  let t1_value = ctx[2](ctx[0]) + "";
  let t1;
  let current;
  icon = new Icon({
    props: {
      path: mdiUpdate,
      size: "24px",
      class: "teal-text mr-1"
    }
  });
  return {
    c() {
      create_component(icon.$$.fragment);
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      insert(target, t0, anchor);
      insert(target, span, anchor);
      append(span, t1);
      current = true;
    },
    p(ctx2, dirty) {
      if ((!current || dirty & 1) && t1_value !== (t1_value = ctx2[2](ctx2[0]) + ""))
        set_data(t1, t1_value);
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
      if (detaching)
        detach(t0);
      if (detaching)
        detach(span);
    }
  };
}
function create_default_slot_2$5(ctx) {
  let col0;
  let t;
  let col1;
  let current;
  col0 = new Col({
    props: {
      class: "d-flex align-center pl-5",
      $$slots: { default: [create_default_slot_4$4] },
      $$scope: { ctx }
    }
  });
  col1 = new Col({
    props: {
      class: "d-flex justify-end pr-5",
      $$slots: { default: [create_default_slot_3$5] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(col0.$$.fragment);
      t = space();
      create_component(col1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(col0, target, anchor);
      insert(target, t, anchor);
      mount_component(col1, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const col0_changes = {};
      if (dirty & 129) {
        col0_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col0.$set(col0_changes);
      const col1_changes = {};
      if (dirty & 129) {
        col1_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col1.$set(col1_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(col0.$$.fragment, local);
      transition_in(col1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(col0.$$.fragment, local);
      transition_out(col1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(col0, detaching);
      if (detaching)
        detach(t);
      destroy_component(col1, detaching);
    }
  };
}
function create_default_slot_1$7(ctx) {
  let row;
  let current;
  row = new Row({
    props: {
      $$slots: { default: [create_default_slot_2$5] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(row.$$.fragment);
    },
    m(target, anchor) {
      mount_component(row, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const row_changes = {};
      if (dirty & 129) {
        row_changes.$$scope = { dirty, ctx: ctx2 };
      }
      row.$set(row_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(row.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(row.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(row, detaching);
    }
  };
}
function create_default_slot$a(ctx) {
  let cardtitle;
  let t0;
  let cardtext;
  let t1;
  let cardactions;
  let current;
  cardtitle = new CardTitle({
    props: {
      $$slots: { default: [create_default_slot_6$3] },
      $$scope: { ctx }
    }
  });
  cardtext = new CardText({
    props: {
      $$slots: { default: [create_default_slot_5$3] },
      $$scope: { ctx }
    }
  });
  cardactions = new CardActions({
    props: {
      $$slots: { default: [create_default_slot_1$7] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(cardtitle.$$.fragment);
      t0 = space();
      create_component(cardtext.$$.fragment);
      t1 = space();
      create_component(cardactions.$$.fragment);
    },
    m(target, anchor) {
      mount_component(cardtitle, target, anchor);
      insert(target, t0, anchor);
      mount_component(cardtext, target, anchor);
      insert(target, t1, anchor);
      mount_component(cardactions, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const cardtitle_changes = {};
      if (dirty & 129) {
        cardtitle_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardtitle.$set(cardtitle_changes);
      const cardtext_changes = {};
      if (dirty & 129) {
        cardtext_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardtext.$set(cardtext_changes);
      const cardactions_changes = {};
      if (dirty & 129) {
        cardactions_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardactions.$set(cardactions_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(cardtitle.$$.fragment, local);
      transition_in(cardtext.$$.fragment, local);
      transition_in(cardactions.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(cardtitle.$$.fragment, local);
      transition_out(cardtext.$$.fragment, local);
      transition_out(cardactions.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(cardtitle, detaching);
      if (detaching)
        detach(t0);
      destroy_component(cardtext, detaching);
      if (detaching)
        detach(t1);
      destroy_component(cardactions, detaching);
    }
  };
}
function create_fragment$d(ctx) {
  let card;
  let current;
  card = new Card({
    props: {
      $$slots: { default: [create_default_slot$a] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(card.$$.fragment);
    },
    m(target, anchor) {
      mount_component(card, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const card_changes = {};
      if (dirty & 129) {
        card_changes.$$scope = { dirty, ctx: ctx2 };
      }
      card.$set(card_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(card.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(card.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(card, detaching);
    }
  };
}
function instance$c($$self, $$props, $$invalidate) {
  let { question = {} } = $$props;
  const dispatchEvent = createEventDispatcher();
  function showQuestionDetailsDialog() {
    dispatchEvent("editQuestion", question);
  }
  function formatCreated({ created }) {
    return formatISO9075(new Date(created));
  }
  $$self.$$set = ($$props2) => {
    if ("question" in $$props2)
      $$invalidate(0, question = $$props2.question);
  };
  return [question, showQuestionDetailsDialog, formatCreated];
}
class Question extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$c, create_fragment$d, safe_not_equal, { question: 0 });
  }
}
function create_fragment$c(ctx) {
  let div;
  let progresscircular;
  let current;
  progresscircular = new ProgressCircular({
    props: {
      indeterminate: true,
      color: "primary",
      size: 50,
      width: 5
    }
  });
  return {
    c() {
      div = element("div");
      create_component(progresscircular.$$.fragment);
      attr(div, "class", "d-flex justify-center");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(progresscircular, div, null);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(progresscircular.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(progresscircular.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(progresscircular);
    }
  };
}
class Spinner extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, null, create_fragment$c, safe_not_equal, {});
  }
}
function isEscKey(e) {
  return e.keyCode && e.keyCode === 27;
}
var codemirror = "";
var mdLight = "";
var questionDetailsContent_svelte_svelte_type_style_lang = "";
function create_else_block$1(ctx) {
  let markdownview;
  let current;
  markdownview = new Markdown_view({ props: { content: ctx[0] } });
  return {
    c() {
      create_component(markdownview.$$.fragment);
    },
    m(target, anchor) {
      mount_component(markdownview, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const markdownview_changes = {};
      if (dirty & 1)
        markdownview_changes.content = ctx2[0];
      markdownview.$set(markdownview_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(markdownview.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(markdownview.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(markdownview, detaching);
    }
  };
}
function create_if_block$5(ctx) {
  let editor;
  let current;
  editor = new Editor_1({
    props: {
      config: ctx[2],
      initialValue: ctx[0],
      onChange: ctx[3]
    }
  });
  return {
    c() {
      create_component(editor.$$.fragment);
    },
    m(target, anchor) {
      mount_component(editor, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const editor_changes = {};
      if (dirty & 1)
        editor_changes.initialValue = ctx2[0];
      editor.$set(editor_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(editor.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(editor.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(editor, detaching);
    }
  };
}
function create_fragment$b(ctx) {
  let button;
  let icon;
  let t;
  let div;
  let current_block_type_index;
  let if_block;
  let current;
  let mounted;
  let dispose;
  icon = new Icon({ props: { path: mdiPencil, size: "24px" } });
  const if_block_creators = [create_if_block$5, create_else_block$1];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[1])
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      button = element("button");
      create_component(icon.$$.fragment);
      t = space();
      div = element("div");
      if_block.c();
      attr(button, "class", "QuestionContent-toggleEditorButton svelte-1a2v3o8");
      attr(button, "title", "Toggle editor");
      attr(div, "class", "QuestionContent-container svelte-1a2v3o8");
      toggle_class(div, "QuestionContent-markdown", !ctx[1]);
      toggle_class(div, "QuestionContent-editor", ctx[1]);
    },
    m(target, anchor) {
      insert(target, button, anchor);
      mount_component(icon, button, null);
      insert(target, t, anchor);
      insert(target, div, anchor);
      if_blocks[current_block_type_index].m(div, null);
      current = true;
      if (!mounted) {
        dispose = listen(button, "click", ctx[4]);
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        transition_in(if_block, 1);
        if_block.m(div, null);
      }
      if (dirty & 2) {
        toggle_class(div, "QuestionContent-markdown", !ctx2[1]);
      }
      if (dirty & 2) {
        toggle_class(div, "QuestionContent-editor", ctx2[1]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(button);
      destroy_component(icon);
      if (detaching)
        detach(t);
      if (detaching)
        detach(div);
      if_blocks[current_block_type_index].d();
      mounted = false;
      dispose();
    }
  };
}
function instance$b($$self, $$props, $$invalidate) {
  let { content } = $$props;
  let { initialShowEditor = true } = $$props;
  let showEditor = false;
  onMount(() => {
    $$invalidate(1, showEditor = initialShowEditor);
  });
  const dispatchEvent = createEventDispatcher();
  const config = {
    lineNumbers: true,
    lineWrapping: true,
    theme: "md-light",
    mode: { name: "gfm", highlightFormatting: true }
  };
  function onChange(newValue) {
    dispatchEvent("change", newValue);
  }
  function toggleEditor() {
    $$invalidate(1, showEditor = !showEditor);
  }
  $$self.$$set = ($$props2) => {
    if ("content" in $$props2)
      $$invalidate(0, content = $$props2.content);
    if ("initialShowEditor" in $$props2)
      $$invalidate(5, initialShowEditor = $$props2.initialShowEditor);
  };
  return [content, showEditor, config, onChange, toggleEditor, initialShowEditor];
}
class Question_details_content extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$b, create_fragment$b, safe_not_equal, { content: 0, initialShowEditor: 5 });
  }
}
function mapLabelNames(labels, labelNames) {
  return labelNames.map((name) => {
    return labels.find((l) => l.name === name) || { name, color: "000000" };
  });
}
function create_if_block$4(ctx) {
  let dialog;
  let current;
  dialog = new Dialog({
    props: {
      active: ctx[1],
      width: ctx[5],
      $$slots: { default: [create_default_slot$9] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(dialog.$$.fragment);
    },
    m(target, anchor) {
      mount_component(dialog, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const dialog_changes = {};
      if (dirty & 2)
        dialog_changes.active = ctx2[1];
      if (dirty & 32)
        dialog_changes.width = ctx2[5];
      if (dirty & 65629) {
        dialog_changes.$$scope = { dirty, ctx: ctx2 };
      }
      dialog.$set(dialog_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(dialog.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(dialog.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(dialog, detaching);
    }
  };
}
function create_default_slot_16(ctx) {
  let t;
  return {
    c() {
      t = text("Title");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_15(ctx) {
  let textfield;
  let updating_value;
  let current;
  function textfield_value_binding(value) {
    ctx[13](value);
  }
  let textfield_props = {
    $$slots: { default: [create_default_slot_16] },
    $$scope: { ctx }
  };
  if (ctx[0].title !== void 0) {
    textfield_props.value = ctx[0].title;
  }
  textfield = new TextField({ props: textfield_props });
  binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));
  return {
    c() {
      create_component(textfield.$$.fragment);
    },
    m(target, anchor) {
      mount_component(textfield, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const textfield_changes = {};
      if (dirty & 65536) {
        textfield_changes.$$scope = { dirty, ctx: ctx2 };
      }
      if (!updating_value && dirty & 1) {
        updating_value = true;
        textfield_changes.value = ctx2[0].title;
        add_flush_callback(() => updating_value = false);
      }
      textfield.$set(textfield_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(textfield.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(textfield.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(textfield, detaching);
    }
  };
}
function create_default_slot_14(ctx) {
  let t;
  return {
    c() {
      t = text("Is answered");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_13(ctx) {
  let checkbox;
  let updating_checked;
  let current;
  function checkbox_checked_binding(value) {
    ctx[14](value);
  }
  let checkbox_props = {
    $$slots: { default: [create_default_slot_14] },
    $$scope: { ctx }
  };
  if (ctx[0].isAnswered !== void 0) {
    checkbox_props.checked = ctx[0].isAnswered;
  }
  checkbox = new Checkbox({ props: checkbox_props });
  binding_callbacks.push(() => bind(checkbox, "checked", checkbox_checked_binding));
  return {
    c() {
      create_component(checkbox.$$.fragment);
    },
    m(target, anchor) {
      mount_component(checkbox, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const checkbox_changes = {};
      if (dirty & 65536) {
        checkbox_changes.$$scope = { dirty, ctx: ctx2 };
      }
      if (!updating_checked && dirty & 1) {
        updating_checked = true;
        checkbox_changes.checked = ctx2[0].isAnswered;
        add_flush_callback(() => updating_checked = false);
      }
      checkbox.$set(checkbox_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(checkbox.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(checkbox.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(checkbox, detaching);
    }
  };
}
function create_default_slot_12$1(ctx) {
  let col0;
  let t;
  let col1;
  let current;
  col0 = new Col({
    props: {
      cols: 12,
      sm: 9,
      $$slots: { default: [create_default_slot_15] },
      $$scope: { ctx }
    }
  });
  col1 = new Col({
    props: {
      cols: 12,
      sm: 3,
      $$slots: { default: [create_default_slot_13] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(col0.$$.fragment);
      t = space();
      create_component(col1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(col0, target, anchor);
      insert(target, t, anchor);
      mount_component(col1, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const col0_changes = {};
      if (dirty & 65537) {
        col0_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col0.$set(col0_changes);
      const col1_changes = {};
      if (dirty & 65537) {
        col1_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col1.$set(col1_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(col0.$$.fragment, local);
      transition_in(col1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(col0.$$.fragment, local);
      transition_out(col1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(col0, detaching);
      if (detaching)
        detach(t);
      destroy_component(col1, detaching);
    }
  };
}
function create_default_slot_11$1(ctx) {
  let tags;
  let current;
  tags = new Tags({
    props: {
      name: "questionLabels",
      autoComplete: ctx[3],
      tags: ctx[4],
      labelText: "Labels:",
      labelShow: true
    }
  });
  tags.$on("tags", ctx[8]);
  return {
    c() {
      create_component(tags.$$.fragment);
    },
    m(target, anchor) {
      mount_component(tags, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const tags_changes = {};
      if (dirty & 8)
        tags_changes.autoComplete = ctx2[3];
      if (dirty & 16)
        tags_changes.tags = ctx2[4];
      tags.$set(tags_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(tags.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(tags.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(tags, detaching);
    }
  };
}
function create_default_slot_10$1(ctx) {
  let col;
  let current;
  col = new Col({
    props: {
      $$slots: { default: [create_default_slot_11$1] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(col.$$.fragment);
    },
    m(target, anchor) {
      mount_component(col, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const col_changes = {};
      if (dirty & 65560) {
        col_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col.$set(col_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(col.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(col.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(col, detaching);
    }
  };
}
function create_default_slot_9$2(ctx) {
  let questiondetailscontent;
  let current;
  questiondetailscontent = new Question_details_content({
    props: {
      content: ctx[0].body,
      initialShowEditor: !ctx[0].id
    }
  });
  questiondetailscontent.$on("change", ctx[11]);
  return {
    c() {
      create_component(questiondetailscontent.$$.fragment);
    },
    m(target, anchor) {
      mount_component(questiondetailscontent, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const questiondetailscontent_changes = {};
      if (dirty & 1)
        questiondetailscontent_changes.content = ctx2[0].body;
      if (dirty & 1)
        questiondetailscontent_changes.initialShowEditor = !ctx2[0].id;
      questiondetailscontent.$set(questiondetailscontent_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(questiondetailscontent.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(questiondetailscontent.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(questiondetailscontent, detaching);
    }
  };
}
function create_default_slot_8$2(ctx) {
  let col;
  let current;
  col = new Col({
    props: {
      class: "pt-0",
      $$slots: { default: [create_default_slot_9$2] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(col.$$.fragment);
    },
    m(target, anchor) {
      mount_component(col, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const col_changes = {};
      if (dirty & 65537) {
        col_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col.$set(col_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(col.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(col.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(col, detaching);
    }
  };
}
function create_default_slot_7$2(ctx) {
  let row0;
  let t0;
  let row1;
  let t1;
  let row2;
  let current;
  row0 = new Row({
    props: {
      class: "flex-column flex-md-row",
      $$slots: { default: [create_default_slot_12$1] },
      $$scope: { ctx }
    }
  });
  row1 = new Row({
    props: {
      $$slots: { default: [create_default_slot_10$1] },
      $$scope: { ctx }
    }
  });
  row2 = new Row({
    props: {
      $$slots: { default: [create_default_slot_8$2] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(row0.$$.fragment);
      t0 = space();
      create_component(row1.$$.fragment);
      t1 = space();
      create_component(row2.$$.fragment);
    },
    m(target, anchor) {
      mount_component(row0, target, anchor);
      insert(target, t0, anchor);
      mount_component(row1, target, anchor);
      insert(target, t1, anchor);
      mount_component(row2, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const row0_changes = {};
      if (dirty & 65537) {
        row0_changes.$$scope = { dirty, ctx: ctx2 };
      }
      row0.$set(row0_changes);
      const row1_changes = {};
      if (dirty & 65560) {
        row1_changes.$$scope = { dirty, ctx: ctx2 };
      }
      row1.$set(row1_changes);
      const row2_changes = {};
      if (dirty & 65537) {
        row2_changes.$$scope = { dirty, ctx: ctx2 };
      }
      row2.$set(row2_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(row0.$$.fragment, local);
      transition_in(row1.$$.fragment, local);
      transition_in(row2.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(row0.$$.fragment, local);
      transition_out(row1.$$.fragment, local);
      transition_out(row2.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(row0, detaching);
      if (detaching)
        detach(t0);
      destroy_component(row1, detaching);
      if (detaching)
        detach(t1);
      destroy_component(row2, detaching);
    }
  };
}
function create_default_slot_6$2(ctx) {
  let t;
  return {
    c() {
      t = text("Cancel");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_5$2(ctx) {
  let t;
  return {
    c() {
      t = text("Ok");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_4$3(ctx) {
  let button0;
  let t;
  let button1;
  let current;
  button0 = new Button({
    props: {
      class: "mr-4",
      size: "large",
      $$slots: { default: [create_default_slot_6$2] },
      $$scope: { ctx }
    }
  });
  button0.$on("click", ctx[9]);
  button1 = new Button({
    props: {
      class: ctx[6],
      disabled: !ctx[2],
      size: "large",
      $$slots: { default: [create_default_slot_5$2] },
      $$scope: { ctx }
    }
  });
  button1.$on("click", ctx[10]);
  return {
    c() {
      create_component(button0.$$.fragment);
      t = space();
      create_component(button1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button0, target, anchor);
      insert(target, t, anchor);
      mount_component(button1, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const button0_changes = {};
      if (dirty & 65536) {
        button0_changes.$$scope = { dirty, ctx: ctx2 };
      }
      button0.$set(button0_changes);
      const button1_changes = {};
      if (dirty & 64)
        button1_changes.class = ctx2[6];
      if (dirty & 4)
        button1_changes.disabled = !ctx2[2];
      if (dirty & 65536) {
        button1_changes.$$scope = { dirty, ctx: ctx2 };
      }
      button1.$set(button1_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(button0.$$.fragment, local);
      transition_in(button1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button0.$$.fragment, local);
      transition_out(button1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button0, detaching);
      if (detaching)
        detach(t);
      destroy_component(button1, detaching);
    }
  };
}
function create_default_slot_3$4(ctx) {
  let col;
  let current;
  col = new Col({
    props: {
      class: "d-flex justify-end",
      $$slots: { default: [create_default_slot_4$3] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(col.$$.fragment);
    },
    m(target, anchor) {
      mount_component(col, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const col_changes = {};
      if (dirty & 65604) {
        col_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col.$set(col_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(col.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(col.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(col, detaching);
    }
  };
}
function create_default_slot_2$4(ctx) {
  let row;
  let current;
  row = new Row({
    props: {
      $$slots: { default: [create_default_slot_3$4] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(row.$$.fragment);
    },
    m(target, anchor) {
      mount_component(row, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const row_changes = {};
      if (dirty & 65604) {
        row_changes.$$scope = { dirty, ctx: ctx2 };
      }
      row.$set(row_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(row.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(row.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(row, detaching);
    }
  };
}
function create_default_slot_1$6(ctx) {
  let cardtext;
  let t;
  let cardactions;
  let current;
  cardtext = new CardText({
    props: {
      $$slots: { default: [create_default_slot_7$2] },
      $$scope: { ctx }
    }
  });
  cardactions = new CardActions({
    props: {
      class: "pr-5",
      $$slots: { default: [create_default_slot_2$4] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(cardtext.$$.fragment);
      t = space();
      create_component(cardactions.$$.fragment);
    },
    m(target, anchor) {
      mount_component(cardtext, target, anchor);
      insert(target, t, anchor);
      mount_component(cardactions, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const cardtext_changes = {};
      if (dirty & 65561) {
        cardtext_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardtext.$set(cardtext_changes);
      const cardactions_changes = {};
      if (dirty & 65604) {
        cardactions_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardactions.$set(cardactions_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(cardtext.$$.fragment, local);
      transition_in(cardactions.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(cardtext.$$.fragment, local);
      transition_out(cardactions.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(cardtext, detaching);
      if (detaching)
        detach(t);
      destroy_component(cardactions, detaching);
    }
  };
}
function create_default_slot$9(ctx) {
  let card;
  let current;
  card = new Card({
    props: {
      class: "pt-5",
      $$slots: { default: [create_default_slot_1$6] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(card.$$.fragment);
    },
    m(target, anchor) {
      mount_component(card, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const card_changes = {};
      if (dirty & 65629) {
        card_changes.$$scope = { dirty, ctx: ctx2 };
      }
      card.$set(card_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(card.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(card.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(card, detaching);
    }
  };
}
function create_fragment$a(ctx) {
  let if_block_anchor;
  let current;
  let mounted;
  let dispose;
  let if_block = ctx[1] && create_if_block$4(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
      if (!mounted) {
        dispose = listen(window, "keydown", ctx[7]);
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (ctx2[1]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 2) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$4(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
      mounted = false;
      dispose();
    }
  };
}
function instance$a($$self, $$props, $$invalidate) {
  let { active = false } = $$props;
  let { question = null } = $$props;
  let isTitleValid = true;
  let allLabelNames = [];
  let selectedLabelNames = [];
  let dialogWidth;
  let okButtonClass = "primary-color";
  const dispatchEvent = createEventDispatcher();
  onMount(() => {
    $$invalidate(5, dialogWidth = isTabletOrDesktopSize() ? "70%" : "98%");
  });
  function onWindowKeydown(event) {
    if (active && isEscKey(event)) {
      cancelDialog();
    }
  }
  function showModal(q) {
    $$invalidate(0, question = q);
    $$invalidate(3, allLabelNames = get_store_value(labelsStore).map((l) => l.name));
    $$invalidate(4, selectedLabelNames = question.labels.map((l) => l.name));
    $$invalidate(1, active = true);
  }
  function onTags(event) {
    $$invalidate(4, selectedLabelNames = event.detail.tags);
  }
  function cancelDialog() {
    $$invalidate(1, active = false);
  }
  async function confirmDialog() {
    $$invalidate(1, active = false);
    const selectedLabels = mapLabelNames(get_store_value(labelsStore), selectedLabelNames);
    $$invalidate(0, question.labels = selectedLabels, question);
    dispatchEvent("closeQuestionDetails", question);
  }
  function changeBody({ detail: newValue }) {
    $$invalidate(0, question.body = newValue, question);
  }
  function textfield_value_binding(value) {
    if ($$self.$$.not_equal(question.title, value)) {
      question.title = value;
      $$invalidate(0, question);
    }
  }
  function checkbox_checked_binding(value) {
    if ($$self.$$.not_equal(question.isAnswered, value)) {
      question.isAnswered = value;
      $$invalidate(0, question);
    }
  }
  $$self.$$set = ($$props2) => {
    if ("active" in $$props2)
      $$invalidate(1, active = $$props2.active);
    if ("question" in $$props2)
      $$invalidate(0, question = $$props2.question);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 5) {
      {
        if (question) {
          $$invalidate(2, isTitleValid = !!question.title);
        }
        $$invalidate(6, okButtonClass = isTitleValid ? "primary-color" : "");
      }
    }
  };
  return [
    question,
    active,
    isTitleValid,
    allLabelNames,
    selectedLabelNames,
    dialogWidth,
    okButtonClass,
    onWindowKeydown,
    onTags,
    cancelDialog,
    confirmDialog,
    changeBody,
    showModal,
    textfield_value_binding,
    checkbox_checked_binding
  ];
}
class Question_details extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$a, create_fragment$a, safe_not_equal, { active: 1, question: 0, showModal: 12 });
  }
  get showModal() {
    return this.$$.ctx[12];
  }
}
var questions_svelte_svelte_type_style_lang = "";
function get_each_context$1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[11] = list[i];
  return child_ctx;
}
function create_each_block$1(key_1, ctx) {
  let div;
  let question;
  let current;
  question = new Question({
    props: { question: ctx[11] }
  });
  question.$on("editQuestion", ctx[5]);
  return {
    key: key_1,
    first: null,
    c() {
      div = element("div");
      create_component(question.$$.fragment);
      attr(div, "class", "Question-container svelte-wjirze");
      this.first = div;
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(question, div, null);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const question_changes = {};
      if (dirty & 1)
        question_changes.question = ctx[11];
      question.$set(question_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(question.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(question.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(question);
    }
  };
}
function create_if_block$3(ctx) {
  let div;
  let viewport_action;
  let current;
  let mounted;
  let dispose;
  let if_block = ctx[1] && create_if_block_1$1();
  return {
    c() {
      div = element("div");
      if (if_block)
        if_block.c();
      attr(div, "class", "Question-container svelte-wjirze");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (if_block)
        if_block.m(div, null);
      current = true;
      if (!mounted) {
        dispose = [
          action_destroyer(viewport_action = viewport.call(null, div)),
          listen(div, "enterViewport", ctx[9])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (ctx2[1]) {
        if (if_block) {
          if (dirty & 2) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block_1$1();
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(div, null);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (if_block)
        if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_1$1(ctx) {
  let spinner;
  let current;
  spinner = new Spinner({});
  return {
    c() {
      create_component(spinner.$$.fragment);
    },
    m(target, anchor) {
      mount_component(spinner, target, anchor);
      current = true;
    },
    i(local) {
      if (current)
        return;
      transition_in(spinner.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(spinner.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(spinner, detaching);
    }
  };
}
function create_fragment$9(ctx) {
  let div;
  let each_blocks = [];
  let each_1_lookup = new Map();
  let t0;
  let t1;
  let questiondetails;
  let current;
  let mounted;
  let dispose;
  let each_value = ctx[0];
  const get_key = (ctx2) => ctx2[11].id;
  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context$1(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
  }
  let if_block = ctx[2] && create_if_block$3(ctx);
  let questiondetails_props = {};
  questiondetails = new Question_details({ props: questiondetails_props });
  ctx[10](questiondetails);
  questiondetails.$on("closeQuestionDetails", ctx[6]);
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t0 = space();
      if (if_block)
        if_block.c();
      t1 = space();
      create_component(questiondetails.$$.fragment);
      attr(div, "class", "Questions-container svelte-wjirze");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(div, null);
      }
      append(div, t0);
      if (if_block)
        if_block.m(div, null);
      insert(target, t1, anchor);
      mount_component(questiondetails, target, anchor);
      current = true;
      if (!mounted) {
        dispose = listen(div, "click", ctx[8]);
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & 33) {
        each_value = ctx2[0];
        group_outros();
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$1, t0, get_each_context$1);
        check_outros();
      }
      if (ctx2[2]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 4) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$3(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(div, null);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
      const questiondetails_changes = {};
      questiondetails.$set(questiondetails_changes);
    },
    i(local) {
      if (current)
        return;
      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      transition_in(if_block);
      transition_in(questiondetails.$$.fragment, local);
      current = true;
    },
    o(local) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      transition_out(if_block);
      transition_out(questiondetails.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      if (if_block)
        if_block.d();
      if (detaching)
        detach(t1);
      ctx[10](null);
      destroy_component(questiondetails, detaching);
      mounted = false;
      dispose();
    }
  };
}
function instance$9($$self, $$props, $$invalidate) {
  let { questions = [] } = $$props;
  let { loading = false } = $$props;
  let { hasMoreData = false } = $$props;
  const dispatchEvent = createEventDispatcher();
  let questionDetailsDialog;
  function addQuestion() {
    const newQuestion = {
      title: "",
      body: "",
      labels: [],
      isAnswered: false
    };
    questionDetailsDialog.showModal(newQuestion);
  }
  function onEditQuestion({ detail: question }) {
    questionDetailsDialog.showModal(__spreadValues({}, question));
  }
  function onCloseQuestionDetails({ detail: question }) {
    const config = get_store_value(configStore);
    if (!question.id) {
      createQuestion(config, question);
    } else {
      updateQuestion(config, question);
    }
  }
  function click_handler(event) {
    bubble.call(this, $$self, event);
  }
  const enterViewport_handler = () => dispatchEvent("loadMore");
  function questiondetails_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      questionDetailsDialog = $$value;
      $$invalidate(3, questionDetailsDialog);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("questions" in $$props2)
      $$invalidate(0, questions = $$props2.questions);
    if ("loading" in $$props2)
      $$invalidate(1, loading = $$props2.loading);
    if ("hasMoreData" in $$props2)
      $$invalidate(2, hasMoreData = $$props2.hasMoreData);
  };
  return [
    questions,
    loading,
    hasMoreData,
    questionDetailsDialog,
    dispatchEvent,
    onEditQuestion,
    onCloseQuestionDetails,
    addQuestion,
    click_handler,
    enterViewport_handler,
    questiondetails_binding
  ];
}
class Questions extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$9, create_fragment$9, safe_not_equal, {
      questions: 0,
      loading: 1,
      hasMoreData: 2,
      addQuestion: 7
    });
  }
  get addQuestion() {
    return this.$$.ctx[7];
  }
}
function create_if_block$2(ctx) {
  let dialog;
  let current;
  dialog = new Dialog({
    props: {
      active: ctx[1],
      $$slots: { default: [create_default_slot$8] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(dialog.$$.fragment);
    },
    m(target, anchor) {
      mount_component(dialog, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const dialog_changes = {};
      if (dirty & 2)
        dialog_changes.active = ctx2[1];
      if (dirty & 2061) {
        dialog_changes.$$scope = { dirty, ctx: ctx2 };
      }
      dialog.$set(dialog_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(dialog.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(dialog.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(dialog, detaching);
    }
  };
}
function create_default_slot_12(ctx) {
  let t;
  return {
    c() {
      t = text("Name");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_11(ctx) {
  let textfield;
  let updating_value;
  let current;
  function textfield_value_binding(value) {
    ctx[7](value);
  }
  let textfield_props = {
    $$slots: { default: [create_default_slot_12] },
    $$scope: { ctx }
  };
  if (ctx[0].name !== void 0) {
    textfield_props.value = ctx[0].name;
  }
  textfield = new TextField({ props: textfield_props });
  binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));
  return {
    c() {
      create_component(textfield.$$.fragment);
    },
    m(target, anchor) {
      mount_component(textfield, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const textfield_changes = {};
      if (dirty & 2048) {
        textfield_changes.$$scope = { dirty, ctx: ctx2 };
      }
      if (!updating_value && dirty & 1) {
        updating_value = true;
        textfield_changes.value = ctx2[0].name;
        add_flush_callback(() => updating_value = false);
      }
      textfield.$set(textfield_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(textfield.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(textfield.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(textfield, detaching);
    }
  };
}
function create_default_slot_10(ctx) {
  let col;
  let current;
  col = new Col({
    props: {
      $$slots: { default: [create_default_slot_11] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(col.$$.fragment);
    },
    m(target, anchor) {
      mount_component(col, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const col_changes = {};
      if (dirty & 2049) {
        col_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col.$set(col_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(col.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(col.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(col, detaching);
    }
  };
}
function create_default_slot_9$1(ctx) {
  let t;
  return {
    c() {
      t = text("Color");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_8$1(ctx) {
  let textfield;
  let updating_value;
  let current;
  function textfield_value_binding_1(value) {
    ctx[8](value);
  }
  let textfield_props = {
    type: "color",
    $$slots: { default: [create_default_slot_9$1] },
    $$scope: { ctx }
  };
  if (ctx[0].color !== void 0) {
    textfield_props.value = ctx[0].color;
  }
  textfield = new TextField({ props: textfield_props });
  binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding_1));
  return {
    c() {
      create_component(textfield.$$.fragment);
    },
    m(target, anchor) {
      mount_component(textfield, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const textfield_changes = {};
      if (dirty & 2048) {
        textfield_changes.$$scope = { dirty, ctx: ctx2 };
      }
      if (!updating_value && dirty & 1) {
        updating_value = true;
        textfield_changes.value = ctx2[0].color;
        add_flush_callback(() => updating_value = false);
      }
      textfield.$set(textfield_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(textfield.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(textfield.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(textfield, detaching);
    }
  };
}
function create_default_slot_7$1(ctx) {
  let col;
  let current;
  col = new Col({
    props: {
      $$slots: { default: [create_default_slot_8$1] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(col.$$.fragment);
    },
    m(target, anchor) {
      mount_component(col, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const col_changes = {};
      if (dirty & 2049) {
        col_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col.$set(col_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(col.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(col.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(col, detaching);
    }
  };
}
function create_default_slot_6$1(ctx) {
  let row0;
  let t;
  let row1;
  let current;
  row0 = new Row({
    props: {
      $$slots: { default: [create_default_slot_10] },
      $$scope: { ctx }
    }
  });
  row1 = new Row({
    props: {
      $$slots: { default: [create_default_slot_7$1] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(row0.$$.fragment);
      t = space();
      create_component(row1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(row0, target, anchor);
      insert(target, t, anchor);
      mount_component(row1, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const row0_changes = {};
      if (dirty & 2049) {
        row0_changes.$$scope = { dirty, ctx: ctx2 };
      }
      row0.$set(row0_changes);
      const row1_changes = {};
      if (dirty & 2049) {
        row1_changes.$$scope = { dirty, ctx: ctx2 };
      }
      row1.$set(row1_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(row0.$$.fragment, local);
      transition_in(row1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(row0.$$.fragment, local);
      transition_out(row1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(row0, detaching);
      if (detaching)
        detach(t);
      destroy_component(row1, detaching);
    }
  };
}
function create_default_slot_5$1(ctx) {
  let t;
  return {
    c() {
      t = text("Ok");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_4$2(ctx) {
  let button;
  let current;
  button = new Button({
    props: {
      class: ctx[3],
      size: "large",
      disabled: !ctx[2],
      $$slots: { default: [create_default_slot_5$1] },
      $$scope: { ctx }
    }
  });
  button.$on("click", ctx[5]);
  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const button_changes = {};
      if (dirty & 8)
        button_changes.class = ctx2[3];
      if (dirty & 4)
        button_changes.disabled = !ctx2[2];
      if (dirty & 2048) {
        button_changes.$$scope = { dirty, ctx: ctx2 };
      }
      button.$set(button_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    }
  };
}
function create_default_slot_3$3(ctx) {
  let col;
  let current;
  col = new Col({
    props: {
      class: "d-flex justify-center",
      $$slots: { default: [create_default_slot_4$2] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(col.$$.fragment);
    },
    m(target, anchor) {
      mount_component(col, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const col_changes = {};
      if (dirty & 2060) {
        col_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col.$set(col_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(col.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(col.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(col, detaching);
    }
  };
}
function create_default_slot_2$3(ctx) {
  let row;
  let current;
  row = new Row({
    props: {
      $$slots: { default: [create_default_slot_3$3] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(row.$$.fragment);
    },
    m(target, anchor) {
      mount_component(row, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const row_changes = {};
      if (dirty & 2060) {
        row_changes.$$scope = { dirty, ctx: ctx2 };
      }
      row.$set(row_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(row.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(row.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(row, detaching);
    }
  };
}
function create_default_slot_1$5(ctx) {
  let cardtext;
  let t;
  let cardactions;
  let current;
  cardtext = new CardText({
    props: {
      $$slots: { default: [create_default_slot_6$1] },
      $$scope: { ctx }
    }
  });
  cardactions = new CardActions({
    props: {
      class: "pr-4",
      $$slots: { default: [create_default_slot_2$3] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(cardtext.$$.fragment);
      t = space();
      create_component(cardactions.$$.fragment);
    },
    m(target, anchor) {
      mount_component(cardtext, target, anchor);
      insert(target, t, anchor);
      mount_component(cardactions, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const cardtext_changes = {};
      if (dirty & 2049) {
        cardtext_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardtext.$set(cardtext_changes);
      const cardactions_changes = {};
      if (dirty & 2060) {
        cardactions_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardactions.$set(cardactions_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(cardtext.$$.fragment, local);
      transition_in(cardactions.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(cardtext.$$.fragment, local);
      transition_out(cardactions.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(cardtext, detaching);
      if (detaching)
        detach(t);
      destroy_component(cardactions, detaching);
    }
  };
}
function create_default_slot$8(ctx) {
  let card;
  let current;
  card = new Card({
    props: {
      class: "pt-5",
      $$slots: { default: [create_default_slot_1$5] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(card.$$.fragment);
    },
    m(target, anchor) {
      mount_component(card, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const card_changes = {};
      if (dirty & 2061) {
        card_changes.$$scope = { dirty, ctx: ctx2 };
      }
      card.$set(card_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(card.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(card.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(card, detaching);
    }
  };
}
function create_fragment$8(ctx) {
  let if_block_anchor;
  let current;
  let mounted;
  let dispose;
  let if_block = ctx[1] && create_if_block$2(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
      if (!mounted) {
        dispose = listen(window, "keydown", ctx[4]);
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (ctx2[1]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 2) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$2(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
      mounted = false;
      dispose();
    }
  };
}
function instance$8($$self, $$props, $$invalidate) {
  let { active = false } = $$props;
  let { label = null } = $$props;
  let isLabelValid = true;
  let okButtonClass = "primary-color";
  const dispatchEvent = createEventDispatcher();
  function showModal(l) {
    $$invalidate(0, label = l);
    $$invalidate(1, active = true);
  }
  function onWindowKeydown(event) {
    if (active && isEscKey(event)) {
      cancelDialog();
    }
  }
  async function cancelDialog() {
    $$invalidate(1, active = false);
  }
  async function confirmDialog() {
    $$invalidate(1, active = false);
    dispatchEvent("closeDialog", label);
  }
  function textfield_value_binding(value) {
    if ($$self.$$.not_equal(label.name, value)) {
      label.name = value;
      $$invalidate(0, label);
    }
  }
  function textfield_value_binding_1(value) {
    if ($$self.$$.not_equal(label.color, value)) {
      label.color = value;
      $$invalidate(0, label);
    }
  }
  $$self.$$set = ($$props2) => {
    if ("active" in $$props2)
      $$invalidate(1, active = $$props2.active);
    if ("label" in $$props2)
      $$invalidate(0, label = $$props2.label);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 5) {
      {
        if (label) {
          $$invalidate(2, isLabelValid = !!label.name);
          $$invalidate(3, okButtonClass = isLabelValid ? "primary-color" : "");
        }
      }
    }
  };
  return [
    label,
    active,
    isLabelValid,
    okButtonClass,
    onWindowKeydown,
    confirmDialog,
    showModal,
    textfield_value_binding,
    textfield_value_binding_1
  ];
}
class Label_edit_dialog extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$8, create_fragment$8, safe_not_equal, { active: 1, label: 0, showModal: 6 });
  }
  get showModal() {
    return this.$$.ctx[6];
  }
}
var label_svelte_svelte_type_style_lang = "";
function create_default_slot$7(ctx) {
  let div;
  let span;
  let t0_value = ctx[1].name + "";
  let t0;
  let t1;
  let button0;
  let icon0;
  let t2;
  let button1;
  let icon1;
  let current;
  let mounted;
  let dispose;
  icon0 = new Icon({
    props: {
      path: mdiPencil,
      size: "24px",
      class: "grey-text"
    }
  });
  icon1 = new Icon({
    props: {
      path: mdiTrashCan,
      size: "24px",
      class: "grey-text"
    }
  });
  return {
    c() {
      div = element("div");
      span = element("span");
      t0 = text(t0_value);
      t1 = space();
      button0 = element("button");
      create_component(icon0.$$.fragment);
      t2 = space();
      button1 = element("button");
      create_component(icon1.$$.fragment);
      set_style(span, "color", ctx[1].color);
      attr(span, "class", "svelte-v09sx9");
      attr(button0, "class", "svelte-v09sx9");
      attr(button1, "class", "svelte-v09sx9");
      attr(div, "class", "LabelContainer svelte-v09sx9");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, span);
      append(span, t0);
      append(div, t1);
      append(div, button0);
      mount_component(icon0, button0, null);
      append(div, t2);
      append(div, button1);
      mount_component(icon1, button1, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(button0, "click", ctx[3]),
          listen(button1, "click", ctx[5])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if ((!current || dirty & 2) && t0_value !== (t0_value = ctx2[1].name + ""))
        set_data(t0, t0_value);
      if (!current || dirty & 2) {
        set_style(span, "color", ctx2[1].color);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(icon0.$$.fragment, local);
      transition_in(icon1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon0.$$.fragment, local);
      transition_out(icon1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(icon0);
      destroy_component(icon1);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_fragment$7(ctx) {
  let checkbox;
  let updating_checked;
  let t;
  let labeleditdialog;
  let current;
  function checkbox_checked_binding(value) {
    ctx[7](value);
  }
  let checkbox_props = {
    $$slots: { default: [create_default_slot$7] },
    $$scope: { ctx }
  };
  if (ctx[0] !== void 0) {
    checkbox_props.checked = ctx[0];
  }
  checkbox = new Checkbox({ props: checkbox_props });
  binding_callbacks.push(() => bind(checkbox, "checked", checkbox_checked_binding));
  checkbox.$on("change", ctx[6]);
  let labeleditdialog_props = {};
  labeleditdialog = new Label_edit_dialog({ props: labeleditdialog_props });
  ctx[8](labeleditdialog);
  labeleditdialog.$on("closeDialog", ctx[4]);
  return {
    c() {
      create_component(checkbox.$$.fragment);
      t = space();
      create_component(labeleditdialog.$$.fragment);
    },
    m(target, anchor) {
      mount_component(checkbox, target, anchor);
      insert(target, t, anchor);
      mount_component(labeleditdialog, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const checkbox_changes = {};
      if (dirty & 1026) {
        checkbox_changes.$$scope = { dirty, ctx: ctx2 };
      }
      if (!updating_checked && dirty & 1) {
        updating_checked = true;
        checkbox_changes.checked = ctx2[0];
        add_flush_callback(() => updating_checked = false);
      }
      checkbox.$set(checkbox_changes);
      const labeleditdialog_changes = {};
      labeleditdialog.$set(labeleditdialog_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(checkbox.$$.fragment, local);
      transition_in(labeleditdialog.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(checkbox.$$.fragment, local);
      transition_out(labeleditdialog.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(checkbox, detaching);
      if (detaching)
        detach(t);
      ctx[8](null);
      destroy_component(labeleditdialog, detaching);
    }
  };
}
function instance$7($$self, $$props, $$invalidate) {
  let { label = {} } = $$props;
  let { checked = false } = $$props;
  let labelEditDialog;
  const dispatchEvent = createEventDispatcher();
  function onEditLabel() {
    labelEditDialog.showModal(__spreadValues({}, label));
  }
  function onCloseDialog({ detail: label2 }) {
    const config = get_store_value(configStore);
    updateLabel(config, label2);
  }
  function onDeleteLabel() {
    const config = get_store_value(configStore);
    deleteLabel(config, label);
  }
  function onSelectLabelChange() {
    dispatchEvent("labelSelectionChanged", { name: label.name, checked });
  }
  function checkbox_checked_binding(value) {
    checked = value;
    $$invalidate(0, checked);
  }
  function labeleditdialog_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      labelEditDialog = $$value;
      $$invalidate(2, labelEditDialog);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("label" in $$props2)
      $$invalidate(1, label = $$props2.label);
    if ("checked" in $$props2)
      $$invalidate(0, checked = $$props2.checked);
  };
  return [
    checked,
    label,
    labelEditDialog,
    onEditLabel,
    onCloseDialog,
    onDeleteLabel,
    onSelectLabelChange,
    checkbox_checked_binding,
    labeleditdialog_binding
  ];
}
class Label extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$7, create_fragment$7, safe_not_equal, { label: 1, checked: 0 });
  }
}
var labels_svelte_svelte_type_style_lang = "";
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[4] = list[i];
  return child_ctx;
}
function create_default_slot_1$4(ctx) {
  let label;
  let t;
  let current;
  label = new Label({
    props: { label: ctx[4], checked: false }
  });
  label.$on("labelSelectionChanged", ctx[1]);
  return {
    c() {
      create_component(label.$$.fragment);
      t = space();
    },
    m(target, anchor) {
      mount_component(label, target, anchor);
      insert(target, t, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const label_changes = {};
      if (dirty & 1)
        label_changes.label = ctx2[4];
      label.$set(label_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(label.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(label.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(label, detaching);
      if (detaching)
        detach(t);
    }
  };
}
function create_each_block(ctx) {
  let listitem;
  let current;
  listitem = new ListItem({
    props: {
      $$slots: { default: [create_default_slot_1$4] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(listitem.$$.fragment);
    },
    m(target, anchor) {
      mount_component(listitem, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const listitem_changes = {};
      if (dirty & 129) {
        listitem_changes.$$scope = { dirty, ctx: ctx2 };
      }
      listitem.$set(listitem_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(listitem.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(listitem.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(listitem, detaching);
    }
  };
}
function create_default_slot$6(ctx) {
  let each_1_anchor;
  let current;
  let each_value = ctx[0];
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }
  const out = (i) => transition_out(each_blocks[i], 1, 1, () => {
    each_blocks[i] = null;
  });
  return {
    c() {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
    },
    m(target, anchor) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }
      insert(target, each_1_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if (dirty & 3) {
        each_value = ctx2[0];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }
        group_outros();
        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      current = true;
    },
    o(local) {
      each_blocks = each_blocks.filter(Boolean);
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      current = false;
    },
    d(detaching) {
      destroy_each(each_blocks, detaching);
      if (detaching)
        detach(each_1_anchor);
    }
  };
}
function create_fragment$6(ctx) {
  let div;
  let list;
  let current;
  list = new List({
    props: {
      $$slots: { default: [create_default_slot$6] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      div = element("div");
      create_component(list.$$.fragment);
      attr(div, "class", "Labels-container svelte-7muxni");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(list, div, null);
      current = true;
    },
    p(ctx2, [dirty]) {
      const list_changes = {};
      if (dirty & 129) {
        list_changes.$$scope = { dirty, ctx: ctx2 };
      }
      list.$set(list_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(list.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(list.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(list);
    }
  };
}
function instance$6($$self, $$props, $$invalidate) {
  let { labels = [] } = $$props;
  let { selectedLabelsSet = new Set([]) } = $$props;
  const dispatchEvent = createEventDispatcher();
  function onLabelSelectionChanged({ detail: label }) {
    if (label.checked) {
      selectedLabelsSet.add(label.name);
    } else {
      selectedLabelsSet.delete(label.name);
    }
    dispatchEvent("labelSelectionChanged", [...selectedLabelsSet]);
  }
  $$self.$$set = ($$props2) => {
    if ("labels" in $$props2)
      $$invalidate(0, labels = $$props2.labels);
    if ("selectedLabelsSet" in $$props2)
      $$invalidate(2, selectedLabelsSet = $$props2.selectedLabelsSet);
  };
  return [labels, onLabelSelectionChanged, selectedLabelsSet];
}
class Labels extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$6, create_fragment$6, safe_not_equal, { labels: 0, selectedLabelsSet: 2 });
  }
}
var sidebar_svelte_svelte_type_style_lang = "";
function create_default_slot$5(ctx) {
  let labels_1;
  let current;
  labels_1 = new Labels({ props: { labels: ctx[0] } });
  labels_1.$on("labelSelectionChanged", ctx[3]);
  return {
    c() {
      create_component(labels_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(labels_1, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const labels_1_changes = {};
      if (dirty & 1)
        labels_1_changes.labels = ctx2[0];
      labels_1.$set(labels_1_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(labels_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(labels_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(labels_1, detaching);
    }
  };
}
function create_fragment$5(ctx) {
  let navigationdrawer;
  let t;
  let overlay;
  let current;
  navigationdrawer = new NavigationDrawer({
    props: {
      style: "height:100%",
      class: "primary-color theme--dark",
      absolute: !ctx[1],
      active: ctx[1] || ctx[2],
      $$slots: { default: [create_default_slot$5] },
      $$scope: { ctx }
    }
  });
  overlay = new Overlay({
    props: {
      index: 1,
      active: !ctx[1] && ctx[2],
      absolute: !ctx[1]
    }
  });
  overlay.$on("click", ctx[4]);
  return {
    c() {
      create_component(navigationdrawer.$$.fragment);
      t = space();
      create_component(overlay.$$.fragment);
    },
    m(target, anchor) {
      mount_component(navigationdrawer, target, anchor);
      insert(target, t, anchor);
      mount_component(overlay, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const navigationdrawer_changes = {};
      if (dirty & 2)
        navigationdrawer_changes.absolute = !ctx2[1];
      if (dirty & 6)
        navigationdrawer_changes.active = ctx2[1] || ctx2[2];
      if (dirty & 65) {
        navigationdrawer_changes.$$scope = { dirty, ctx: ctx2 };
      }
      navigationdrawer.$set(navigationdrawer_changes);
      const overlay_changes = {};
      if (dirty & 6)
        overlay_changes.active = !ctx2[1] && ctx2[2];
      if (dirty & 2)
        overlay_changes.absolute = !ctx2[1];
      overlay.$set(overlay_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(navigationdrawer.$$.fragment, local);
      transition_in(overlay.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(navigationdrawer.$$.fragment, local);
      transition_out(overlay.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(navigationdrawer, detaching);
      if (detaching)
        detach(t);
      destroy_component(overlay, detaching);
    }
  };
}
function instance$5($$self, $$props, $$invalidate) {
  let { labels = [] } = $$props;
  let { isPermanent = true } = $$props;
  const dispatchEvent = createEventDispatcher();
  let isSidebarActive = false;
  onMount(() => {
    $$invalidate(2, isSidebarActive = get_store_value(toggleSidebarStore));
    toggleSidebarStore.subscribe((newValue) => {
      $$invalidate(2, isSidebarActive = newValue);
    });
  });
  function onLabelSelectionChanged({ detail: labels2 }) {
    const { searchQuery } = get_store_value(questionsStore);
    dispatchEvent("searchQueryChanged", __spreadProps(__spreadValues({}, searchQuery), { labels: labels2 }));
  }
  function closeSidebar() {
    toggleSidebarStore.set(false);
  }
  $$self.$$set = ($$props2) => {
    if ("labels" in $$props2)
      $$invalidate(0, labels = $$props2.labels);
    if ("isPermanent" in $$props2)
      $$invalidate(1, isPermanent = $$props2.isPermanent);
  };
  return [labels, isPermanent, isSidebarActive, onLabelSelectionChanged, closeSidebar];
}
class Sidebar extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$5, create_fragment$5, safe_not_equal, { labels: 0, isPermanent: 1 });
  }
}
var index_svelte_svelte_type_style_lang$1 = "";
const { document: document_1 } = globals;
function create_if_block$1(ctx) {
  let appbar;
  let t0;
  let div0;
  let sidebar;
  let t1;
  let div1;
  let questions;
  let current;
  appbar = new AppBar({
    props: {
      dense: true,
      class: "primary-color theme--dark",
      $$slots: {
        title: [create_title_slot$1],
        icon: [create_icon_slot],
        default: [create_default_slot_1$3]
      },
      $$scope: { ctx }
    }
  });
  sidebar = new Sidebar({
    props: {
      labels: ctx[5],
      isPermanent: !ctx[3]
    }
  });
  sidebar.$on("searchQueryChanged", ctx[14]);
  const questions_spread_levels = [{ slot: "content" }, ctx[6]];
  let questions_props = {};
  for (let i = 0; i < questions_spread_levels.length; i += 1) {
    questions_props = assign(questions_props, questions_spread_levels[i]);
  }
  questions = new Questions({ props: questions_props });
  ctx[16](questions);
  questions.$on("loadMore", ctx[7]);
  questions.$on("click", ctx[9]);
  return {
    c() {
      create_component(appbar.$$.fragment);
      t0 = space();
      div0 = element("div");
      create_component(sidebar.$$.fragment);
      t1 = space();
      div1 = element("div");
      create_component(questions.$$.fragment);
      attr(div0, "class", "Sidebar-container svelte-pik101");
      attr(div1, "class", "Content-container svelte-pik101");
    },
    m(target, anchor) {
      mount_component(appbar, target, anchor);
      insert(target, t0, anchor);
      insert(target, div0, anchor);
      mount_component(sidebar, div0, null);
      insert(target, t1, anchor);
      insert(target, div1, anchor);
      mount_component(questions, div1, null);
      current = true;
    },
    p(ctx2, dirty) {
      const appbar_changes = {};
      if (dirty & 524316) {
        appbar_changes.$$scope = { dirty, ctx: ctx2 };
      }
      appbar.$set(appbar_changes);
      const sidebar_changes = {};
      if (dirty & 32)
        sidebar_changes.labels = ctx2[5];
      if (dirty & 8)
        sidebar_changes.isPermanent = !ctx2[3];
      sidebar.$set(sidebar_changes);
      const questions_changes = dirty & 64 ? get_spread_update(questions_spread_levels, [
        questions_spread_levels[0],
        get_spread_object(ctx2[6])
      ]) : {};
      questions.$set(questions_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(appbar.$$.fragment, local);
      transition_in(sidebar.$$.fragment, local);
      transition_in(questions.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(appbar.$$.fragment, local);
      transition_out(sidebar.$$.fragment, local);
      transition_out(questions.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(appbar, detaching);
      if (detaching)
        detach(t0);
      if (detaching)
        detach(div0);
      destroy_component(sidebar);
      if (detaching)
        detach(t1);
      if (detaching)
        detach(div1);
      ctx[16](null);
      destroy_component(questions);
    }
  };
}
function create_default_slot_4$1(ctx) {
  let icon;
  let current;
  icon = new Icon({ props: { path: mdiMagnify } });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function create_default_slot_3$2(ctx) {
  let icon;
  let current;
  icon = new Icon({ props: { path: mdiNotePlusOutline } });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function create_default_slot_2$2(ctx) {
  let icon;
  let current;
  icon = new Icon({ props: { path: mdiGithub } });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function create_default_slot_1$3(ctx) {
  let div0;
  let t0;
  let div1;
  let textfield;
  let updating_value;
  let t1;
  let button0;
  let t2;
  let button1;
  let t3;
  let button2;
  let current;
  function textfield_value_binding(value) {
    ctx[15](value);
  }
  let textfield_props = { placeholder: "Search", clearable: true };
  if (ctx[2] !== void 0) {
    textfield_props.value = ctx[2];
  }
  textfield = new TextField({ props: textfield_props });
  binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));
  textfield.$on("keydown", ctx[12]);
  textfield.$on("change", ctx[13]);
  button0 = new Button({
    props: {
      fab: true,
      depressed: true,
      text: true,
      $$slots: { default: [create_default_slot_4$1] },
      $$scope: { ctx }
    }
  });
  button0.$on("click", ctx[13]);
  button1 = new Button({
    props: {
      fab: true,
      depressed: true,
      text: true,
      $$slots: { default: [create_default_slot_3$2] },
      $$scope: { ctx }
    }
  });
  button1.$on("click", ctx[10]);
  button2 = new Button({
    props: {
      fab: true,
      depressed: true,
      text: true,
      $$slots: { default: [create_default_slot_2$2] },
      $$scope: { ctx }
    }
  });
  button2.$on("click", ctx[11]);
  return {
    c() {
      div0 = element("div");
      t0 = space();
      div1 = element("div");
      create_component(textfield.$$.fragment);
      t1 = space();
      create_component(button0.$$.fragment);
      t2 = space();
      create_component(button1.$$.fragment);
      t3 = space();
      create_component(button2.$$.fragment);
      attr(div0, "class", "flex-grow-0 flex-sm-grow-1");
      attr(div1, "class", "d-flex flex-row flex-grow-1 flex-sm-grow-0");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      insert(target, t0, anchor);
      insert(target, div1, anchor);
      mount_component(textfield, div1, null);
      append(div1, t1);
      mount_component(button0, div1, null);
      append(div1, t2);
      mount_component(button1, div1, null);
      append(div1, t3);
      mount_component(button2, div1, null);
      current = true;
    },
    p(ctx2, dirty) {
      const textfield_changes = {};
      if (!updating_value && dirty & 4) {
        updating_value = true;
        textfield_changes.value = ctx2[2];
        add_flush_callback(() => updating_value = false);
      }
      textfield.$set(textfield_changes);
      const button0_changes = {};
      if (dirty & 524288) {
        button0_changes.$$scope = { dirty, ctx: ctx2 };
      }
      button0.$set(button0_changes);
      const button1_changes = {};
      if (dirty & 524288) {
        button1_changes.$$scope = { dirty, ctx: ctx2 };
      }
      button1.$set(button1_changes);
      const button2_changes = {};
      if (dirty & 524288) {
        button2_changes.$$scope = { dirty, ctx: ctx2 };
      }
      button2.$set(button2_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(textfield.$$.fragment, local);
      transition_in(button0.$$.fragment, local);
      transition_in(button1.$$.fragment, local);
      transition_in(button2.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(textfield.$$.fragment, local);
      transition_out(button0.$$.fragment, local);
      transition_out(button1.$$.fragment, local);
      transition_out(button2.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div0);
      if (detaching)
        detach(t0);
      if (detaching)
        detach(div1);
      destroy_component(textfield);
      destroy_component(button0);
      destroy_component(button1);
      destroy_component(button2);
    }
  };
}
function create_if_block_2(ctx) {
  let button;
  let current;
  button = new Button({
    props: {
      fab: true,
      depressed: true,
      text: true,
      $$slots: { default: [create_default_slot$4] },
      $$scope: { ctx }
    }
  });
  button.$on("click", ctx[8]);
  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const button_changes = {};
      if (dirty & 524288) {
        button_changes.$$scope = { dirty, ctx: ctx2 };
      }
      button.$set(button_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    }
  };
}
function create_default_slot$4(ctx) {
  let icon;
  let current;
  icon = new Icon({ props: { path: mdiMenu } });
  return {
    c() {
      create_component(icon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(icon, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(icon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(icon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(icon, detaching);
    }
  };
}
function create_icon_slot(ctx) {
  let div;
  let current;
  let if_block = ctx[3] && create_if_block_2(ctx);
  return {
    c() {
      div = element("div");
      if (if_block)
        if_block.c();
      attr(div, "slot", "icon");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (if_block)
        if_block.m(div, null);
      current = true;
    },
    p(ctx2, dirty) {
      if (ctx2[3]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 8) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block_2(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(div, null);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (if_block)
        if_block.d();
    }
  };
}
function create_if_block_1(ctx) {
  let t;
  return {
    c() {
      t = text("HowCanI 2");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_title_slot$1(ctx) {
  let span;
  let if_block = ctx[4] && create_if_block_1();
  return {
    c() {
      span = element("span");
      if (if_block)
        if_block.c();
      attr(span, "slot", "title");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      if (if_block)
        if_block.m(span, null);
    },
    p(ctx2, dirty) {
      if (ctx2[4]) {
        if (if_block)
          ;
        else {
          if_block = create_if_block_1();
          if_block.c();
          if_block.m(span, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching)
        detach(span);
      if (if_block)
        if_block.d();
    }
  };
}
function create_fragment$4(ctx) {
  let t;
  let if_block_anchor;
  let current;
  let if_block = ctx[0] && create_if_block$1(ctx);
  return {
    c() {
      t = space();
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
      document_1.title = "HowCanI Home";
    },
    m(target, anchor) {
      insert(target, t, anchor);
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      if (ctx2[0]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 1) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$1(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(t);
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function instance$4($$self, $$props, $$invalidate) {
  let $labelsStore;
  let $questionsStore;
  component_subscribe($$self, labelsStore, ($$value) => $$invalidate(5, $labelsStore = $$value));
  component_subscribe($$self, questionsStore, ($$value) => $$invalidate(6, $questionsStore = $$value));
  let config;
  let questionsElement;
  let searchTerm = "";
  let isSidebarActive = true;
  let isToggleSidebarButtonVisible = false;
  let showAppTitle = true;
  onMount(() => {
    $$invalidate(0, config = get_store_value(configStore));
    if (!config.user) {
      push("/connect");
      return;
    }
    const { searchQuery } = get_store_value(questionsStore);
    loadQuestions(config, searchQuery, 1);
    loadLabels(config);
    if (!isTabletOrDesktopSize()) {
      isSidebarActive = true;
      $$invalidate(3, isToggleSidebarButtonVisible = true);
    }
    toggleSidebarStore.set(isSidebarActive);
  });
  const resizeObserver = new window.ResizeObserver(() => {
    $$invalidate(3, isToggleSidebarButtonVisible = !isTabletOrDesktopSize());
    if (isTabletOrDesktopSize() && !isSidebarActive) {
      isSidebarActive = true;
      toggleSidebarStore.set(true);
    }
    if (!isTabletOrDesktopSize() && isSidebarActive) {
      isSidebarActive = false;
      toggleSidebarStore.set(false);
    }
    $$invalidate(4, showAppTitle = isMinIPadPortraitSize());
  });
  resizeObserver.observe(document.scrollingElement);
  function loadMoreQuestions() {
    const { page, searchQuery } = get_store_value(questionsStore);
    loadQuestions(config, searchQuery, page + 1);
  }
  function toggleSidebar() {
    isSidebarActive = !isSidebarActive;
    toggleSidebarStore.set(isSidebarActive);
  }
  function hideSidebar() {
    if (isTabletOrDesktopSize()) {
      return;
    }
    const isToggled = get_store_value(toggleSidebarStore);
    if (isToggled) {
      toggleSidebar();
    }
  }
  function addQuestion() {
    questionsElement.addQuestion();
  }
  function gotoConnectPage() {
    push("/connect?logoff");
  }
  function onSearchInputKeyPress(event) {
    if (event.code !== "Enter") {
      return;
    }
    onSearchClick();
  }
  function onSearchClick() {
    const { searchQuery } = get_store_value(questionsStore);
    searchQuery.query = searchTerm;
    loadQuestions(config, searchQuery, 1);
  }
  function onSearchQueryChanged({ detail: searchQuery }) {
    loadQuestions(config, searchQuery, 1);
  }
  function textfield_value_binding(value) {
    searchTerm = value;
    $$invalidate(2, searchTerm);
  }
  function questions_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      questionsElement = $$value;
      $$invalidate(1, questionsElement);
    });
  }
  return [
    config,
    questionsElement,
    searchTerm,
    isToggleSidebarButtonVisible,
    showAppTitle,
    $labelsStore,
    $questionsStore,
    loadMoreQuestions,
    toggleSidebar,
    hideSidebar,
    addQuestion,
    gotoConnectPage,
    onSearchInputKeyPress,
    onSearchClick,
    onSearchQueryChanged,
    textfield_value_binding,
    questions_binding
  ];
}
class Questions_1 extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$4, create_fragment$4, safe_not_equal, {});
  }
}
function isLocalHost() {
  return window.location.hostname === "localhost";
}
function create_default_slot_3$1(ctx) {
  let h2;
  let t1;
  let p2;
  return {
    c() {
      h2 = element("h2");
      h2.textContent = "Login to GitHub";
      t1 = space();
      p2 = element("p");
      p2.textContent = "To be able to work with HowCanI you need to login with your GitHub account and then select a\n      Git repository where the data should be saved.";
      attr(h2, "class", "heading text-h4 mb-3");
    },
    m(target, anchor) {
      insert(target, h2, anchor);
      insert(target, t1, anchor);
      insert(target, p2, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(h2);
      if (detaching)
        detach(t1);
      if (detaching)
        detach(p2);
    }
  };
}
function create_default_slot_2$1(ctx) {
  let t;
  return {
    c() {
      t = text("Login");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_1$2(ctx) {
  let button;
  let current;
  button = new Button({
    props: {
      class: "primary-color",
      $$slots: { default: [create_default_slot_2$1] },
      $$scope: { ctx }
    }
  });
  button.$on("click", ctx[0]);
  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const button_changes = {};
      if (dirty & 2) {
        button_changes.$$scope = { dirty, ctx: ctx2 };
      }
      button.$set(button_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    }
  };
}
function create_default_slot$3(ctx) {
  let cardtext;
  let t;
  let cardactions;
  let current;
  cardtext = new CardText({
    props: {
      $$slots: { default: [create_default_slot_3$1] },
      $$scope: { ctx }
    }
  });
  cardactions = new CardActions({
    props: {
      $$slots: { default: [create_default_slot_1$2] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(cardtext.$$.fragment);
      t = space();
      create_component(cardactions.$$.fragment);
    },
    m(target, anchor) {
      mount_component(cardtext, target, anchor);
      insert(target, t, anchor);
      mount_component(cardactions, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const cardtext_changes = {};
      if (dirty & 2) {
        cardtext_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardtext.$set(cardtext_changes);
      const cardactions_changes = {};
      if (dirty & 2) {
        cardactions_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardactions.$set(cardactions_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(cardtext.$$.fragment, local);
      transition_in(cardactions.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(cardtext.$$.fragment, local);
      transition_out(cardactions.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(cardtext, detaching);
      if (detaching)
        detach(t);
      destroy_component(cardactions, detaching);
    }
  };
}
function create_fragment$3(ctx) {
  let card;
  let current;
  card = new Card({
    props: {
      outlined: true,
      style: "max-width:600px;",
      $$slots: { default: [create_default_slot$3] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(card.$$.fragment);
    },
    m(target, anchor) {
      mount_component(card, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const card_changes = {};
      if (dirty & 2) {
        card_changes.$$scope = { dirty, ctx: ctx2 };
      }
      card.$set(card_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(card.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(card.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(card, detaching);
    }
  };
}
function instance$3($$self) {
  function loginToGitHub() {
    const oauthClientId = isLocalHost() ? "c5571ab869190bdc5f33" : "82a001ac3b1f5f2aa7ff";
    window.location.href = `https://github-oauth-bridge.vercel.app//api/login?clientId=${oauthClientId}`;
  }
  return [loginToGitHub];
}
class Login extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
  }
}
function create_default_slot_9(ctx) {
  let t;
  return {
    c() {
      t = text("User");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_8(ctx) {
  let textfield;
  let current;
  textfield = new TextField({
    props: {
      readonly: true,
      filled: true,
      value: ctx[0],
      $$slots: { default: [create_default_slot_9] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(textfield.$$.fragment);
    },
    m(target, anchor) {
      mount_component(textfield, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const textfield_changes = {};
      if (dirty & 1)
        textfield_changes.value = ctx2[0];
      if (dirty & 128) {
        textfield_changes.$$scope = { dirty, ctx: ctx2 };
      }
      textfield.$set(textfield_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(textfield.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(textfield.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(textfield, detaching);
    }
  };
}
function create_default_slot_7(ctx) {
  let col;
  let current;
  col = new Col({
    props: {
      $$slots: { default: [create_default_slot_8] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(col.$$.fragment);
    },
    m(target, anchor) {
      mount_component(col, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const col_changes = {};
      if (dirty & 129) {
        col_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col.$set(col_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(col.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(col.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(col, detaching);
    }
  };
}
function create_default_slot_6(ctx) {
  let t;
  return {
    c() {
      t = text("Repository");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_5(ctx) {
  let textfield;
  let updating_value;
  let current;
  function textfield_value_binding(value) {
    ctx[4](value);
  }
  let textfield_props = {
    placeholder: "Enter repository name",
    error: !ctx[2],
    $$slots: { default: [create_default_slot_6] },
    $$scope: { ctx }
  };
  if (ctx[1] !== void 0) {
    textfield_props.value = ctx[1];
  }
  textfield = new TextField({ props: textfield_props });
  binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));
  return {
    c() {
      create_component(textfield.$$.fragment);
    },
    m(target, anchor) {
      mount_component(textfield, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const textfield_changes = {};
      if (dirty & 4)
        textfield_changes.error = !ctx2[2];
      if (dirty & 128) {
        textfield_changes.$$scope = { dirty, ctx: ctx2 };
      }
      if (!updating_value && dirty & 2) {
        updating_value = true;
        textfield_changes.value = ctx2[1];
        add_flush_callback(() => updating_value = false);
      }
      textfield.$set(textfield_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(textfield.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(textfield.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(textfield, detaching);
    }
  };
}
function create_default_slot_4(ctx) {
  let col;
  let current;
  col = new Col({
    props: {
      $$slots: { default: [create_default_slot_5] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(col.$$.fragment);
    },
    m(target, anchor) {
      mount_component(col, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const col_changes = {};
      if (dirty & 134) {
        col_changes.$$scope = { dirty, ctx: ctx2 };
      }
      col.$set(col_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(col.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(col.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(col, detaching);
    }
  };
}
function create_default_slot_3(ctx) {
  let h2;
  let t1;
  let p2;
  let t3;
  let row0;
  let t4;
  let row1;
  let current;
  row0 = new Row({
    props: {
      $$slots: { default: [create_default_slot_7] },
      $$scope: { ctx }
    }
  });
  row1 = new Row({
    props: {
      $$slots: { default: [create_default_slot_4] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      h2 = element("h2");
      h2.textContent = "Connect to GitHub repository";
      t1 = space();
      p2 = element("p");
      p2.textContent = "Please enter your GitHub user name and select a repository";
      t3 = space();
      create_component(row0.$$.fragment);
      t4 = space();
      create_component(row1.$$.fragment);
      attr(h2, "class", "heading text-h4 mb-3");
    },
    m(target, anchor) {
      insert(target, h2, anchor);
      insert(target, t1, anchor);
      insert(target, p2, anchor);
      insert(target, t3, anchor);
      mount_component(row0, target, anchor);
      insert(target, t4, anchor);
      mount_component(row1, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const row0_changes = {};
      if (dirty & 129) {
        row0_changes.$$scope = { dirty, ctx: ctx2 };
      }
      row0.$set(row0_changes);
      const row1_changes = {};
      if (dirty & 134) {
        row1_changes.$$scope = { dirty, ctx: ctx2 };
      }
      row1.$set(row1_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(row0.$$.fragment, local);
      transition_in(row1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(row0.$$.fragment, local);
      transition_out(row1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(h2);
      if (detaching)
        detach(t1);
      if (detaching)
        detach(p2);
      if (detaching)
        detach(t3);
      destroy_component(row0, detaching);
      if (detaching)
        detach(t4);
      destroy_component(row1, detaching);
    }
  };
}
function create_default_slot_2(ctx) {
  let t;
  return {
    c() {
      t = text("Connect");
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_default_slot_1$1(ctx) {
  let button;
  let current;
  button = new Button({
    props: {
      class: "primary-color",
      type: "submit",
      $$slots: { default: [create_default_slot_2] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const button_changes = {};
      if (dirty & 128) {
        button_changes.$$scope = { dirty, ctx: ctx2 };
      }
      button.$set(button_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    }
  };
}
function create_default_slot$2(ctx) {
  let cardtext;
  let t;
  let cardactions;
  let current;
  cardtext = new CardText({
    props: {
      $$slots: { default: [create_default_slot_3] },
      $$scope: { ctx }
    }
  });
  cardactions = new CardActions({
    props: {
      $$slots: { default: [create_default_slot_1$1] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(cardtext.$$.fragment);
      t = space();
      create_component(cardactions.$$.fragment);
    },
    m(target, anchor) {
      mount_component(cardtext, target, anchor);
      insert(target, t, anchor);
      mount_component(cardactions, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const cardtext_changes = {};
      if (dirty & 135) {
        cardtext_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardtext.$set(cardtext_changes);
      const cardactions_changes = {};
      if (dirty & 128) {
        cardactions_changes.$$scope = { dirty, ctx: ctx2 };
      }
      cardactions.$set(cardactions_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(cardtext.$$.fragment, local);
      transition_in(cardactions.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(cardtext.$$.fragment, local);
      transition_out(cardactions.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(cardtext, detaching);
      if (detaching)
        detach(t);
      destroy_component(cardactions, detaching);
    }
  };
}
function create_fragment$2(ctx) {
  let form;
  let card;
  let current;
  let mounted;
  let dispose;
  card = new Card({
    props: {
      outlined: true,
      style: "max-width:600px;",
      $$slots: { default: [create_default_slot$2] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      form = element("form");
      create_component(card.$$.fragment);
    },
    m(target, anchor) {
      insert(target, form, anchor);
      mount_component(card, form, null);
      current = true;
      if (!mounted) {
        dispose = listen(form, "submit", prevent_default(ctx[3]));
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      const card_changes = {};
      if (dirty & 135) {
        card_changes.$$scope = { dirty, ctx: ctx2 };
      }
      card.$set(card_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(card.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(card.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(form);
      destroy_component(card);
      mounted = false;
      dispose();
    }
  };
}
function instance$2($$self, $$props, $$invalidate) {
  let user = "";
  let repository = "";
  let isUserValid = true;
  let isRepositoryValid = true;
  configStore.subscribe((config) => {
    if (!config.oauthToken) {
      return;
    }
    readUser(config.oauthToken);
  });
  async function readUser(oauthToken) {
    const githubService = new GithubService();
    const githubUser = await githubService.getAuthenticatedUser(oauthToken);
    if (githubUser) {
      $$invalidate(0, user = githubUser.loginName);
    }
  }
  async function handleSubmit() {
    isUserValid = !!user;
    $$invalidate(2, isRepositoryValid = !!repository);
    if (isUserValid) {
      const githubService = new GithubService();
      const githubUser = await githubService.getUser(user);
      if (!githubUser) {
        isUserValid = false;
        $$invalidate(2, isRepositoryValid = false);
        return;
      }
      const githubRepository = await githubService.getRepository(user, repository);
      if (!githubRepository) {
        $$invalidate(2, isRepositoryValid = false);
        return;
      }
    }
    if (isUserValid && isRepositoryValid) {
      configStore.update((config) => {
        config.user = user;
        config.repository = repository;
        return config;
      });
      push("/");
    }
  }
  function textfield_value_binding(value) {
    repository = value;
    $$invalidate(1, repository);
  }
  return [user, repository, isRepositoryValid, handleSubmit, textfield_value_binding];
}
class Repository_selection extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
  }
}
var index_svelte_svelte_type_style_lang = "";
function create_default_slot$1(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      set_style(div, "flex-grow", "1");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_title_slot(ctx) {
  let span;
  return {
    c() {
      span = element("span");
      span.textContent = "HowCanI 2";
      attr(span, "slot", "title");
    },
    m(target, anchor) {
      insert(target, span, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_else_block(ctx) {
  let repositoryselection;
  let current;
  repositoryselection = new Repository_selection({});
  return {
    c() {
      create_component(repositoryselection.$$.fragment);
    },
    m(target, anchor) {
      mount_component(repositoryselection, target, anchor);
      current = true;
    },
    i(local) {
      if (current)
        return;
      transition_in(repositoryselection.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(repositoryselection.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(repositoryselection, detaching);
    }
  };
}
function create_if_block(ctx) {
  let login;
  let current;
  login = new Login({});
  return {
    c() {
      create_component(login.$$.fragment);
    },
    m(target, anchor) {
      mount_component(login, target, anchor);
      current = true;
    },
    i(local) {
      if (current)
        return;
      transition_in(login.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(login.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(login, detaching);
    }
  };
}
function create_fragment$1(ctx) {
  let t0;
  let appbar;
  let t1;
  let section;
  let current_block_type_index;
  let if_block;
  let current;
  appbar = new AppBar({
    props: {
      dense: true,
      class: "primary-color theme--dark",
      $$slots: {
        title: [create_title_slot],
        default: [create_default_slot$1]
      },
      $$scope: { ctx }
    }
  });
  const if_block_creators = [create_if_block, create_else_block];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[0])
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      t0 = space();
      create_component(appbar.$$.fragment);
      t1 = space();
      section = element("section");
      if_block.c();
      document.title = "HowCanI - Connect to GitHub repository";
      attr(section, "class", "svelte-1l30687");
    },
    m(target, anchor) {
      insert(target, t0, anchor);
      mount_component(appbar, target, anchor);
      insert(target, t1, anchor);
      insert(target, section, anchor);
      if_blocks[current_block_type_index].m(section, null);
      current = true;
    },
    p(ctx2, [dirty]) {
      const appbar_changes = {};
      if (dirty & 4) {
        appbar_changes.$$scope = { dirty, ctx: ctx2 };
      }
      appbar.$set(appbar_changes);
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index !== previous_block_index) {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        }
        transition_in(if_block, 1);
        if_block.m(section, null);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(appbar.$$.fragment, local);
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(appbar.$$.fragment, local);
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(t0);
      destroy_component(appbar, detaching);
      if (detaching)
        detach(t1);
      if (detaching)
        detach(section);
      if_blocks[current_block_type_index].d();
    }
  };
}
function instance$1($$self, $$props, $$invalidate) {
  let mustLogin = false;
  let config;
  onMount(() => {
    const querystring$1 = get_store_value(querystring);
    if (querystring$1) {
      const searchParams = new URLSearchParams(querystring$1);
      if (searchParams.get("token")) {
        configStore.update((config2) => {
          config2.oauthToken = searchParams.get("token");
          return config2;
        });
        replace("/connect");
      } else if (searchParams.get("logoff") !== null) {
        configStore.update((config2) => {
          config2.oauthToken = void 0;
          return config2;
        });
        replace("/connect");
      }
    }
    config = get_store_value(configStore);
    if (!config.oauthToken) {
      $$invalidate(0, mustLogin = true);
    }
  });
  return [mustLogin];
}
class Connect extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
  }
}
var app_svelte_svelte_type_style_lang = "";
function create_default_slot_1(ctx) {
  let span;
  let t0;
  let t1;
  let t2;
  let b;
  return {
    c() {
      span = element("span");
      t0 = text("HowCanI - Copyright ");
      t1 = text(ctx[0]);
      t2 = text(" by ");
      b = element("b");
      b.textContent = "Jan Baer";
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
      append(span, t2);
      append(span, b);
    },
    p: noop,
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_default_slot(ctx) {
  let router;
  let t;
  let footer;
  let current;
  router = new Router({ props: { routes: ctx[1] } });
  footer = new Footer({
    props: {
      padless: true,
      class: "primary-color theme--dark justify-center flex-column",
      $$slots: { default: [create_default_slot_1] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(router.$$.fragment);
      t = space();
      create_component(footer.$$.fragment);
    },
    m(target, anchor) {
      mount_component(router, target, anchor);
      insert(target, t, anchor);
      mount_component(footer, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const footer_changes = {};
      if (dirty & 4) {
        footer_changes.$$scope = { dirty, ctx: ctx2 };
      }
      footer.$set(footer_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(router.$$.fragment, local);
      transition_in(footer.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(router.$$.fragment, local);
      transition_out(footer.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(router, detaching);
      if (detaching)
        detach(t);
      destroy_component(footer, detaching);
    }
  };
}
function create_fragment(ctx) {
  let materialapp;
  let current;
  materialapp = new MaterialApp({
    props: {
      theme,
      $$slots: { default: [create_default_slot] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(materialapp.$$.fragment);
    },
    m(target, anchor) {
      mount_component(materialapp, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const materialapp_changes = {};
      if (dirty & 4) {
        materialapp_changes.$$scope = { dirty, ctx: ctx2 };
      }
      materialapp.$set(materialapp_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(materialapp.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(materialapp.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(materialapp, detaching);
    }
  };
}
let theme = "light";
function instance($$self) {
  let year = new Date().getFullYear();
  const routes = { "/": Questions_1, "/connect": Connect };
  return [year, routes];
}
class App extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {});
  }
}
var global = "";
new App({
  target: window.document.getElementById("app")
});
