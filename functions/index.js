// Copyright 2018, Thifaine Noirault.

'use strict';

const {
  dialogflow,
  Permission,
  Confirmation,
  Suggestions,
  SimpleResponse,
  BasicCard
} = require('actions-on-google');

const functions = require('firebase-functions');//
const alphabet = require('./alphabet.json');
const responses = require('./responses.js');
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const numbersLong = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const ALPHABET_LENGTH = 26;
const CUBE_LENGTH = 10;
const SQUARE_LENGTH = 20;
let startingNewGame = false;
let alreadyPlayedData = [];
let currentGame = "";

const app = dialogflow({debug: true});

/**
 * Gets a random element from an array.
 * @param {Array<object>} a The array to retrieve an element from.
 * @return {object} The random element retrieved from the array.
 */
const random = (a) => a[Math.floor(Math.random() * a.length)];

app.intent('ChooseGame', 'PlayGame');

app.intent('PlayGame', (conv, {AvailableGames}) => {
});

app.intent('PlayCube', (conv, {AvailableGames}) => {
  startingNewGame = true;
  currentGame = AvailableGames;
  conv.followup('NewRoundEvent')
});

app.intent('PlayCubeRoot', (conv, {AvailableGames}) => {
  startingNewGame = true;
  currentGame = AvailableGames;
  conv.followup('NewRoundEvent')
});

app.intent('PlaySquareRoot', (conv, {AvailableGames}) => {
  startingNewGame = true;
  currentGame = AvailableGames;
  conv.followup('NewRoundEvent')
});

app.intent('PlaySquare', (conv, {AvailableGames}) => {
  startingNewGame = true;
  currentGame = AvailableGames;
  conv.followup('NewRoundEvent')
});

app.intent('PlayAlphabet', (conv, {AvailableGames}) => {
  startingNewGame = true;
  currentGame = AvailableGames;
  conv.followup('NewRoundEvent')
});

app.intent('NewRound', (conv) => {
  var gameData, answer, currentRound;
  conv.data.currentRound++;

  switch(currentGame) {
    case 'Alphabet':
        gameData = alphabet.data;
        break;
    case 'Cube':
    case 'Cube Root':
        gameData = numbers;
        break;
    case 'Square':
    case 'Square Root':
        gameData = numbersLong;
        break;
  }

  if (currentGame == 'Alphabet' && Object.keys(gameData).length === 0) {
    return conv.close(responses.general.missingData);
  }
  if (startingNewGame) {
    alreadyPlayedData = [];
    currentRound = 1;
  } else {
    currentRound = conv.data.currentRound;
  }
  let remainingData = gameData;
  var i = gameData.length;
  while (i--) {
    let gameCompare = currentGame == 'Alphabet' ? gameData[i].letter : gameData[i];
    if(alreadyPlayedData.indexOf(gameCompare)!=-1){
        remainingData.splice(i,1);
    }
  }
  var question = random(remainingData);
  switch(currentGame) {
    case 'Alphabet':
        answer = question.position;
        break;
    case 'Cube':
        answer = Math.pow(question, 3);
        break;
    case 'Cube Root':
        answer = question;
        question = Math.pow(question, 3);
        break;
    case 'Square':
        answer = Math.pow(question, 2);
        break;
    case 'Square Root':
        answer = question;
        question = Math.pow(question, 2);
        break;
  }

  conv.data = {
    game: currentGame,
    currentRound: currentRound,
    alreadyPlayedData: alreadyPlayedData,
    remainingData: remainingData,
    question: currentGame == 'Alphabet' ? question.letter : question,
    answer: answer
  };
  let say = startingNewGame ? responses.general.newGame : '';
  conv.ask(say + conv.data.question);
  startingNewGame = false;
});

app.intent('GuessAnswer', (conv, {answer}) => {
  let correctAnswer = conv.data.answer;
  let length = currentGame == 'Alphabet' ? ALPHABET_LENGTH : currentGame == 'Cube' ? CUBE_LENGTH : SQUARE_LENGTH;

  if (correctAnswer == answer) {
    alreadyPlayedData.push(conv.data.question);
    conv.data.alreadyPlayedData = alreadyPlayedData;

    if (conv.data.currentRound >= length) {
      conv.ask(new Confirmation(responses.general.startAgain));
    } else {
      conv.followup('NewRoundEvent')
    }
  } else {
    conv.ask(responses.general.again + conv.data.question);
  }
});

app.intent('actions_intent_CONFIRMATION', (conv, input, confirmation) => {
  if (confirmation) {
    startingNewGame = true;
    conv.followup('NewRoundEvent')
  } else {
    conv.close(new SimpleResponse({
      text: responses.general.endGame,
      speech: responses.general.endGame
    }));
    if (conv.screen) {
      conv.close(new BasicCard({
        text: responses.general.endGame,
        title: responses.general.endGame
      }));
    }
  }
})

app.intent('DefaultWelcomeIntent', (conv) => {
  // To add User Permission
  // conv.ask(new Permission({
  //   context: responses.general.askForPermission,
  //   permissions: 'NAME'
  // }));
  let suggestions = Object.keys(responses.categories);
  conv.ask(responses.general.permissionGranted, new Suggestions(suggestions));
});

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
// app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
//   let response;
//   let suggestions = Object.keys(responses.categories);
//   if (!permissionGranted) {
//     response = responses.general.permissionNotGranted;
//   } else {
//     conv.data.userName = conv.user.name.display;
//     response = `Merci, ${conv.data.userName}. ` + responses.general.permissionGranted;
//   }
//   conv.ask(response, new Suggestions(suggestions));
// });

/**
 * Greet the user and direct them to next turn
 * @param {DialogflowConversation} conv DialogflowConversation instance
 * @return {void}
 */
app.intent('UnrecognizedDeepLink', (conv) => {
  const response = util.format(responses.general.unhandled, conv.query);
  const suggestions = Object.keys(responses.categories);
  conv.ask(response, new Suggestions(suggestions));
});

app.intent('QuitApp', (conv) => {
    conv.close(responses.general.quitApp);
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
