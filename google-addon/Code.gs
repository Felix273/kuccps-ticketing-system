/**
 * KUCCPS IT Ticketing System - Google Workspace Add-on
 * Creates backend tickets and captures CSAT feedback directly from Gmail.
 */

const DEFAULT_CONFIG = {
  API_URL: 'https://store-town-icq-substantially.trycloudflare.com/api',
  SUPPORT_EMAIL: 'itsupport@kuccps.ac.ke',
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
  return createMainCard();
}

function onGmailOpen(e) {
  return createMainCard(e);
}

function onComposeOpen() {
  return createMainCard();
}

function getConfig() {
  const properties = PropertiesService.getScriptProperties();

  let baseUrl = cleanProperty(properties.getProperty('API_URL')) || DEFAULT_CONFIG.API_URL;
  baseUrl = baseUrl.replace(/\/public\/tickets\/?$/i, '').replace(/\/+$/, '');

  return {
    BASE_URL: baseUrl,
    PUBLIC_TICKET_URL: baseUrl + '/public/tickets',
    MY_TICKETS_URL: baseUrl + '/tickets/public/my-tickets',
    CSAT_URL: baseUrl + '/operations/csat/public',
    SUPPORT_EMAIL: cleanProperty(properties.getProperty('SUPPORT_EMAIL')) || DEFAULT_CONFIG.SUPPORT_EMAIL,
    BACKEND_API_KEY: cleanProperty(properties.getProperty('BACKEND_API_KEY')) || DEFAULT_CONFIG.BACKEND_API_KEY
  };
}

function createMainCard(e) {
  const userEmail = Session.getActiveUser().getEmail();
  const config = getConfig();

  // Try to check if user has resolved tickets awaiting CSAT rating
  const pendingCsatTicket = checkPendingCsatTicket(userEmail, config);

  if (pendingCsatTicket) {
    return createCsatRatingCard(pendingCsatTicket);
  }

  return createTicketFormCard(userEmail, config);
}

function checkPendingCsatTicket(userEmail, config) {
  try {
    if (!config.MY_TICKETS_URL || !userEmail) return null;

    const headers = {};
    if (config.BACKEND_API_KEY) {
      headers['X-API-Key'] = config.BACKEND_API_KEY;
      headers.Authorization = 'Bearer ' + config.BACKEND_API_KEY;
    }

    const url = config.MY_TICKETS_URL + '?email=' + encodeURIComponent(userEmail);
    const options = {
      method: 'get',
      headers: headers,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      const parsed = JSON.parse(response.getContentText());
      if (parsed.success && parsed.tickets && parsed.tickets.length > 0) {
        // Find a resolved ticket without CSAT rating
        const resolvedTicket = parsed.tickets.find(function(t) {
          return (t.status === 'Resolved' || t.status === 'Closed') && !t.csatRated;
        });
        return resolvedTicket || null;
      }
    }
  } catch (err) {
    Logger.log('Error checking pending CSAT ticket: ' + err);
  }
  return null;
}

function createTicketFormCard(userEmail, config) {
  const card = CardService.newCardBuilder();

  const header = CardService.newCardHeader()
    .setTitle('KUCCPS IT Support')
    .setSubtitle('Submit a Support Ticket')
    .setImageUrl('https://careers.kuccps.net/Images/KUCCPS-Logo.png')
    .setImageStyle(CardService.ImageStyle.SQUARE);

  card.setHeader(header);

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
      .setText('<font color="#6b7280"><i>Updates will be sent from ' + escapeHtml(config.SUPPORT_EMAIL) + '.</i></font>')
  );

  card.addSection(section);
  return card.build();
}

function createCsatRatingCard(ticket) {
  const card = CardService.newCardBuilder();

  const header = CardService.newCardHeader()
    .setTitle('Service Satisfaction Survey')
    .setSubtitle('Ticket #' + ticket.ticketNumber + ' Resolved')
    .setImageUrl('https://careers.kuccps.net/Images/KUCCPS-Logo.png')
    .setImageStyle(CardService.ImageStyle.SQUARE);

  card.setHeader(header);

  const section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextParagraph()
      .setText('Your IT support request <b>"' + escapeHtml(ticket.subject) + '"</b> was recently marked as <b>Resolved</b>.')
  );

  section.addWidget(
    CardService.newTextParagraph()
      .setText('Please rate your satisfaction with the support offered:')
  );

  section.addWidget(CardService.newDivider());

  // Hidden ticket ID parameter
  section.addWidget(
    CardService.newTextInput()
      .setFieldName('ticketId')
      .setTitle('Ticket ID')
      .setValue(ticket.id)
      .setMultiline(false)
  );

  const ratingDropdown = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Satisfaction Rating')
    .setFieldName('rating');

  ratingDropdown.addItem('⭐⭐⭐⭐⭐ 5 Stars - Extremely Contented', '5', true);
  ratingDropdown.addItem('⭐⭐⭐⭐ 4 Stars - Contented', '4', false);
  ratingDropdown.addItem('⭐⭐⭐ 3 Stars - Satisfied (Good)', '3', false);
  ratingDropdown.addItem('⭐⭐ 2 Stars - Discontented (Needs Improvement)', '2', false);
  ratingDropdown.addItem('⭐ 1 Star - Very Discontented', '1', false);

  section.addWidget(ratingDropdown);

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('comment')
      .setTitle('Feedback / Comments (Optional)')
      .setHint('Share your thoughts or suggestions regarding this service')
      .setMultiline(true)
  );

  section.addWidget(CardService.newDivider());

  const submitCsatButton = CardService.newTextButton()
    .setText('Submit Rating')
    .setOnClickAction(CardService.newAction().setFunctionName('submitCsatFeedback'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#911414');

  const skipButton = CardService.newTextButton()
    .setText('Skip for now / New Ticket')
    .setOnClickAction(CardService.newAction().setFunctionName('onHomepage'))
    .setTextButtonStyle(CardService.TextButtonStyle.TEXT);

  section.addWidget(CardService.newButtonSet().addButton(submitCsatButton).addButton(skipButton));

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

    const response = submitToBackend(ticketData, config.PUBLIC_TICKET_URL, config);

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

function submitCsatFeedback(e) {
  try {
    const config = getConfig();
    const formInput = e.formInput || {};
    const userEmail = Session.getActiveUser().getEmail();

    const rating = parseInt(formInput.rating, 10) || 5;
    const comment = formInput.comment ? String(formInput.comment).trim() : '';
    const ticketId = formInput.ticketId;

    if (!ticketId) {
      return createErrorCard('Ticket ID is missing.');
    }

    const payload = {
      ticketId: ticketId,
      rating: rating,
      comment: comment,
      requesterEmail: userEmail
    };

    const response = submitToBackend(payload, config.CSAT_URL, config);

    if (response.success) {
      const card = CardService.newCardBuilder();
      const header = CardService.newCardHeader()
        .setTitle('Thank You!')
        .setSubtitle('Feedback Submitted')
        .setImageUrl('https://careers.kuccps.net/Images/KUCCPS-Logo.png');
      card.setHeader(header);

      const section = CardService.newCardSection();
      const statusText = rating >= 3
        ? 'Thank you for your positive feedback! We are glad to serve you.'
        : 'Thank you for your feedback. We regret that the service did not meet your expectations and our ICT supervisor has been alerted to review this.';

      section.addWidget(CardService.newTextParagraph().setText('<b>' + statusText + '</b>'));
      section.addWidget(CardService.newDivider());

      const newTicketButton = CardService.newTextButton()
        .setText('Create New Ticket')
        .setOnClickAction(CardService.newAction().setFunctionName('onHomepage'))
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor('#911414');

      section.addWidget(CardService.newButtonSet().addButton(newTicketButton));
      card.addSection(section);

      return CardService.newActionResponseBuilder()
        .setNavigation(CardService.newNavigation().updateCard(card.build()))
        .build();
    }

    return createErrorCard('Failed to save rating: ' + (response.message || 'Unknown error'));
  } catch (error) {
    Logger.log('Error submitting CSAT: ' + error);
    return createErrorCard('An error occurred while submitting feedback.');
  }
}

function submitToBackend(data, url, config) {
  try {
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('Backend URL is invalid.');
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
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

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
    .setTitle('Submission Failed')
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
