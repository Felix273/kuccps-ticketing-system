/**
 * KUCCPS IT Ticketing System - Google Workspace Add-on
 * Creates backend tickets from Gmail.
 */

const DEFAULT_CONFIG = {
  API_URL: 'https://buffer-utilities-salary-assigned.trycloudflare.com/api/public/tickets',
  SUPPORT_EMAIL: 'emmanuel.kitanga@kuccps.ac.ke',
  BACKEND_API_KEY: ''
};

const ISSUE_CATEGORIES = [
  'Hardware Issues',
  'Software Issues',
  'Network & Connectivity Issues',
  'Email & Communication Issues',
  'Access & Permissions Issues',
  'Printer & Peripheral Issues',
  'Security Issues',
  'General Issues'
];

const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

function onHomepage() {
  return createTicketCard();
}

function onGmailOpen() {
  return createTicketCard();
}

function onComposeOpen() {
  return createTicketCard();
}

function getConfig() {
  const properties = PropertiesService.getScriptProperties();

  return {
    API_URL: cleanProperty(properties.getProperty('API_URL')) || DEFAULT_CONFIG.API_URL,
    SUPPORT_EMAIL: cleanProperty(properties.getProperty('SUPPORT_EMAIL')) || DEFAULT_CONFIG.SUPPORT_EMAIL,
    BACKEND_API_KEY: cleanProperty(properties.getProperty('BACKEND_API_KEY')) || DEFAULT_CONFIG.BACKEND_API_KEY
  };
}

function setupProductionProperties() {
  const properties = PropertiesService.getScriptProperties();
  const existing = properties.getProperties();
  const values = {};

  if (!existing.API_URL) values.API_URL = DEFAULT_CONFIG.API_URL;
  if (!existing.SUPPORT_EMAIL) values.SUPPORT_EMAIL = DEFAULT_CONFIG.SUPPORT_EMAIL;

  if (Object.keys(values).length > 0) {
    properties.setProperties(values, false);
  }

  Logger.log('Script properties checked. Set values: ' + Object.keys(values).join(', '));
}

function createTicketCard() {
  const config = getConfig();
  const card = CardService.newCardBuilder();

  const header = CardService.newCardHeader()
    .setTitle('KUCCPS IT Support')
    .setSubtitle('Submit a Support Ticket')
    .setImageUrl('https://careers.kuccps.net/Images/KUCCPS-Logo.png')
    .setImageStyle(CardService.ImageStyle.SQUARE);

  card.setHeader(header);

  const userEmail = Session.getActiveUser().getEmail();
  const section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextParagraph()
      .setText('<b>Your Email:</b> ' + escapeHtml(userEmail))
  );

  section.addWidget(CardService.newDivider());

  const categoryDropdown = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Issue Category')
    .setFieldName('category');

  ISSUE_CATEGORIES.forEach(function(category) {
    categoryDropdown.addItem(category, category, category === 'General Issues');
  });

  section.addWidget(categoryDropdown);

  const priorityDropdown = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Priority')
    .setFieldName('priority');

  PRIORITY_LEVELS.forEach(function(priority) {
    priorityDropdown.addItem(priority, priority, priority === 'Medium');
  });

  section.addWidget(priorityDropdown);

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('subject')
      .setTitle('Subject')
      .setHint('Brief description of the issue')
      .setMultiline(false)
  );

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('description')
      .setTitle('Description')
      .setHint('Provide detailed information about the issue')
      .setMultiline(true)
  );

  section.addWidget(CardService.newDivider());

  const submitButton = CardService.newTextButton()
    .setText('Submit Ticket')
    .setOnClickAction(CardService.newAction().setFunctionName('submitTicket'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#911414');

  section.addWidget(CardService.newButtonSet().addButton(submitButton));

  section.addWidget(
    CardService.newTextParagraph()
      .setText('<font color="#6b7280"><i>Your ticket will be created in the IT ticketing system. Updates will be sent from ' + escapeHtml(config.SUPPORT_EMAIL) + '.</i></font>')
  );

  card.addSection(section);
  return card.build();
}

function submitTicket(e) {
  try {
    const config = getConfig();
    const formInput = e.formInput || {};
    const userEmail = Session.getActiveUser().getEmail();

    if (!formInput.subject || !formInput.description) {
      return createErrorCard('Please fill in all required fields.');
    }

    const ticketData = {
      subject: String(formInput.subject).trim(),
      description: String(formInput.description).trim(),
      requesterEmail: userEmail,
      category: formInput.category || 'General Issues',
      priority: formInput.priority || 'Medium'
    };

    const response = submitToBackend(ticketData, config);

    if (response.success) {
      return createSuccessCard(
        'Ticket created successfully. Ticket number: ' + response.ticket.ticketNumber
      );
    }

    return createErrorCard('Backend failed: ' + (response.message || 'Unknown error'));
  } catch (error) {
    Logger.log('Error submitting ticket: ' + error);
    return createErrorCard('An error occurred while submitting the ticket. Please contact ICT if it persists.');
  }
}

function submitToBackend(ticketData, config) {
  try {
    if (!/^https?:\/\//i.test(config.API_URL)) {
      throw new Error('Backend URL is invalid. Check API_URL in Script Properties.');
    }

    const headers = {};

    if (config.BACKEND_API_KEY) {
      headers['X-API-Key'] = config.BACKEND_API_KEY;
      headers.Authorization = 'Bearer ' + config.BACKEND_API_KEY;
    }

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      payload: JSON.stringify(ticketData),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(config.API_URL, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('Backend URL: ' + config.API_URL);
    Logger.log('Backend status: ' + statusCode);
    Logger.log('Backend response: ' + responseText);

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      return {
        success: false,
        message: 'Backend returned HTTP ' + statusCode + ': ' + responseText.slice(0, 160)
      };
    }

    if (statusCode < 200 || statusCode >= 300) {
      return {
        success: false,
        message: parsed.message || ('Backend returned HTTP ' + statusCode)
      };
    }

    return parsed;
  } catch (error) {
    Logger.log('Backend API error: ' + error);
    return {
      success: false,
      message: error.message
    };
  }
}

function createSuccessCard(message) {
  const card = CardService.newCardBuilder();

  const header = CardService.newCardHeader()
    .setTitle('Ticket Submitted Successfully')
    .setImageUrl('https://careers.kuccps.net/Images/KUCCPS-Logo.png')
    .setImageStyle(CardService.ImageStyle.SQUARE);

  card.setHeader(header);

  const section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextParagraph()
      .setText('<b>' + escapeHtml(message) + '</b>')
  );

  section.addWidget(CardService.newDivider());

  section.addWidget(
    CardService.newTextParagraph()
      .setText('You will receive updates by email as the ticket is processed.')
  );

  const newTicketButton = CardService.newTextButton()
    .setText('Submit Another Ticket')
    .setOnClickAction(CardService.newAction().setFunctionName('onHomepage'))
    .setTextButtonStyle(CardService.TextButtonStyle.TEXT);

  section.addWidget(CardService.newButtonSet().addButton(newTicketButton));

  card.addSection(section);

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card.build()))
    .build();
}

function createErrorCard(errorMessage) {
  const config = getConfig();
  const card = CardService.newCardBuilder();

  const header = CardService.newCardHeader()
    .setTitle('Ticket Submission Failed')
    .setImageUrl('https://careers.kuccps.net/Images/KUCCPS-Logo.png')
    .setImageStyle(CardService.ImageStyle.SQUARE);

  card.setHeader(header);

  const section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextParagraph()
      .setText('<font color="#dc2626"><b>' + escapeHtml(errorMessage) + '</b></font>')
  );

  section.addWidget(CardService.newDivider());

  section.addWidget(
    CardService.newTextParagraph()
      .setText('Please try again or contact ICT directly at ' + escapeHtml(config.SUPPORT_EMAIL))
  );

  const tryAgainButton = CardService.newTextButton()
    .setText('Try Again')
    .setOnClickAction(CardService.newAction().setFunctionName('onHomepage'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#911414');

  section.addWidget(CardService.newButtonSet().addButton(tryAgainButton));

  card.addSection(section);

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card.build()))
    .build();
}

function cleanProperty(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
