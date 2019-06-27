/**
 * @since 2016-11-23 10:23
 * @author vivaxy
 */

const debug = require('debug');
const wrap = require('word-wrap');
const prompts = require('prompts');

const { getHistory, setHistory } = require('./messages/history.js');
const {
  getCommitTypes,
  updateTypesStat,
} = require('./messages/commitTypes.js');
const { getGitmojis, updateGitmojisStat } = require('./messages/gitmojis.js');

const debugPrompt = debug('prompt');

module.exports = async ({ emojiType }) => {
  const [typeList, gitmojiList] = await Promise.all([
    getCommitTypes(),
    getGitmojis({ emojiType }),
  ]);
  const history = getHistory();

  function findInitial(list, key) {
    const index = list.findIndex(function({ value }) {
      return value === key;
    });
    if (index === -1) {
      return 0;
    }
    return index;
  }

  function suggest(input, choices) {
    return choices.filter(function({ title, value }) {
      return (
        title.toLowerCase().indexOf(input.toLowerCase()) > -1 ||
        value.toLowerCase().indexOf(input.toLowerCase()) > -1
      );
    });
  }

  debugPrompt('history:', history);

  // ${type}(${scope}): ${emoji}${subject} \n\n ${body} \n\n ${footer}
  const questions = [
    {
      type: 'autocomplete',
      name: 'type',
      message: "Select the type of change that you're committing",
      choices: typeList,
      initial: findInitial(typeList, history.type),
      suggest,
    },
    {
      type: 'text',
      name: 'desc',
      message: 'Write a short, imperative tense description of the change',
      initial: history.subject,
    },
    {
      type: 'text',
      name: 'url',
      message: 'Provide a tapd url of the change',
      initial: history.body,
    },
  ];

  const answers = await prompts(questions, {
    onCancel() {
      process.exit(0);
    },
  });

  debugPrompt('got answers', answers);
  setHistory(answers);

  const maxHeaderLength = 72;
  const maxLineWidth = 100;

  const wrapOptions = {
    trim: true,
    newline: '\n',
    indent: '',
    width: maxLineWidth,
  };

  // Hard limit this line
  let head = `${answers.type}: ${answers.desc.trim()}`;
  head = head.slice(0, maxHeaderLength);

  // Wrap these lines at 100 characters
  const url = wrap(answers.url, wrapOptions);

  await updateTypesStat(answers.type);

  await updateGitmojisStat({ key: 'none', value: '' });

  return `${head} url:${url}`;
};
