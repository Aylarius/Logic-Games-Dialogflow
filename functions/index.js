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
const responses = require('./responses.js');
const suggestions = [ "Alphabet", "Cube", "Carré", "Racine carrée", "Racine cubique", "Calcul Mental Niveau 1", "Calcul Mental Niveau 2"];

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

const randomMentalMath = function(a, b) {
  let newMath = false;
  while (newMath) {
    if (alreadyPlayedData.indexOf(a + ' x ' + b) != -1) {
      a = random(remainingData);
      b = random(remainingData);
    } else {
      newMath = true;
    }
  }
  return {
    firstValue: a,
    secondValue: b
  };
}

app.intent('ChooseGame', 'PlayGame');

app.intent('PlayGame', (conv, {AvailableGames}) => {
  startingNewGame = true;
  currentGame = AvailableGames;
  conv.followup('NewRoundEvent')
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

app.intent('PlayMentalMathLvl1', (conv, {AvailableGames}) => {
  startingNewGame = true;
  currentGame = AvailableGames;
  conv.followup('NewRoundEvent')
});

app.intent('PlayMentalMathLvl2', (conv, {AvailableGames}) => {
  startingNewGame = true;
  currentGame = AvailableGames;
  conv.followup('NewRoundEvent')
});

app.intent('NewRound', (conv) => {
  var answer, currentRound, remainingData, question2, values;
  conv.data.currentRound++;
  var gameData = startingNewGame ? responses.categories[currentGame].data : responses.categories[conv.data.game].data;
  remainingData = gameData.slice(0);

  if (startingNewGame) {
    alreadyPlayedData = [];
    currentRound = 1;
    if (currentGame == 'Alphabet' && Object.keys(gameData).length === 0) {
      return conv.close(responses.general.missingData);
    }
  } else {
    currentGame = conv.data.game;
    currentRound = conv.data.currentRound;
  }

  var i = startingNewGame ? responses.categories[currentGame].numberOfQuestions : responses.categories[conv.data.game].numberOfQuestions;
  while (i--) {
    let gameCompare = currentGame == 'Alphabet' ? gameData[i].letter : gameData[i];
    if(alreadyPlayedData.indexOf(gameData[i]) != -1){
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
    case 'Mental Math 1':
    case 'Mental Math 2':
        question2 = random(remainingData);
        values = randomMentalMath(question, question2);
        question = values.firstValue + ' x ' + values.secondValue;
        answer = values.firstValue * values.secondValue;
        break;
  }
  if (currentGame == 'Square Root' || currentGame == 'Cube Root') {
    alreadyPlayedData.push(answer);
  } else {
    alreadyPlayedData.push(question);
  }

  let numberOfQuestions = startingNewGame ? responses.categories[currentGame].numberOfQuestions : responses.categories[conv.data.game].numberOfQuestions;
  if (currentGame == 'Alphabet') {
    numberOfQuestions = responses.categories[currentGame].roundLength;
  }

  conv.data = {
    game: currentGame,
    currentRound: currentRound,
    alreadyPlayedData: alreadyPlayedData,
    remainingData: remainingData,
    question: currentGame == 'Alphabet' ? question.letter : question,
    answer: answer,
    startingNewGame: startingNewGame,
    roundOver: currentRound >= numberOfQuestions ? true : false
  };
  let say = startingNewGame ? responses.general.newGame + ' ' + responses.categories[currentGame].intro : '';
  conv.ask(say + conv.data.question + ' ?');
  startingNewGame = false;
});

app.intent('GuessAnswer', (conv, {answer}) => {
  if (conv.data.answer == answer) {
    if (conv.data.roundOver) {
      startingNewGame = true;
      conv.ask(new Confirmation(responses.general.startAgain));
    } else {
      conv.followup('NewRoundEvent')
    }
  } else {
    conv.ask(responses.general.again + conv.data.question + ' ?');
  }
});

app.intent('actions_intent_CONFIRMATION', (conv, input, confirmation) => {
  if (confirmation) {
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
  conv.ask(responses.general.permissionGranted, new Suggestions(suggestions));
});

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
// app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
//   let response;
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
  conv.ask(responses.general.unhandled, new Suggestions(suggestions));
});

app.intent('HelpIntent', (conv) => {
  var x = Math.floor((Math.random() * 2));
  conv.ask(responses.general.help[x]);
});

app.intent('QuitApp', (conv) => {
    conv.close(responses.general.quitApp);
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
