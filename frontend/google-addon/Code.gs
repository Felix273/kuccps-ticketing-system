/**
 * KUCCPS IT Ticketing System - Google Workspace Add-on
 * Allows staff to submit IT support tickets directly from Gmail
 */

// Configuration
const CONFIG = {
  API_URL: 'http://localhost:5000/api/tickets/public',
  ICT_EMAIL: 'felix.ngitari@kuccps.ac.ke',
  BACKEND_API_KEY: 'your-api-key-here' // Optional: for API authentication
};

// Issue categories matching your backend
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

/**
 * Callback for rendering the homepage card.
 * @return {CardService.Card} The card to show to the user.
 */
function onHomepage() {
  return createTicketCard();
}

/**
 * Callback when user opens Gmail
 * @return {CardService.Card} The card to show to the user.
 */
function onGmailOpen() {
  return createTicketCard();
}

/**
 * Callback when user is composing an email
 * @return {CardService.Card} The card to show to the user.
 */
function onComposeOpen() {
  return createTicketCard();
}

/**
 * Creates the main ticket submission card
 * @return {CardService.Card} The card with the ticket form
 */
function createTicketCard() {
  const card = CardService.newCardBuilder();
  
  // Header
  const header = CardService.newCardHeader()
    .setTitle('KUCCPS IT Support')
    .setSubtitle('Submit a Support Ticket')
    .setImageUrl('https://www.kuccps.net/wp-content/uploads/2019/11/kuccps-logo.png')
    .setImageStyle(CardService.ImageStyle.SQUARE);
  
  card.setHeader(header);
  
  // Get user email
  const userEmail = Session.getActiveUser().getEmail();
  
  // Form Section
  const section = CardService.newCardSection();
  
  // User email (read-only)
  section.addWidget(
    CardService.newTextParagraph()
      .setText('<b>Your Email:</b> ' + userEmail)
  );
  
  section.addWidget(CardService.newDivider());
  
  // Category dropdown
  const categoryDropdown = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Issue Category')
    .setFieldName('category');
  
  ISSUE_CATEGORIES.forEach(function(category) {
    categoryDropdown.addItem(category, category, category === 'General Issues');
  });
  
  section.addWidget(categoryDropdown);
  
  // Priority dropdown
  const priorityDropdown = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Priority')
    .setFieldName('priority');
  
  PRIORITY_LEVELS.forEach(function(priority) {
    priorityDropdown.addItem(priority, priority, priority === 'Medium');
  });
  
  section.addWidget(priorityDropdown);
  
  // Subject input
  section.addWidget(
    CardService.newTextInput()
      .setFieldName('subject')
      .setTitle('Subject')
      .setHint('Brief description of the issue')
      .setMultiline(false)
  );
  
  // Description input
  section.addWidget(
    CardService.newTextInput()
      .setFieldName('description')
      .setTitle('Description')
      .setHint('Provide detailed information about the issue')
      .setMultiline(true)
  );
  
  section.addWidget(CardService.newDivider());
  
  // Submit button
  const submitButton = CardService.newTextButton()
    .setText('Submit Ticket')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('submitTicket'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#911414');
  
  section.addWidget(
    CardService.newButtonSet()
      .addButton(submitButton)
  );
  
  // Instructions
  section.addWidget(
    CardService.newTextParagraph()
      .setText('<font color="#6b7280"><i>Your ticket will be sent to the IT department and you\'ll receive a confirmation email with your ticket number.</i></font>')
  );
  
  card.addSection(section);
  
  return card.build();
}

/**
 * Handles ticket submission
 * @param {Object} e The event object from the action.
 * @return {CardService.ActionResponse} The response to show to the user.
 */
function submitTicket(e) {
  try {
    const formInput = e.formInput;
    const userEmail = Session.getActiveUser().getEmail();
    
    // Validate inputs
    if (!formInput.subject || !formInput.description) {
      return createErrorCard('Please fill in all required fields.');
    }
    
    // Prepare ticket data
    const ticketData = {
      subject: formInput.subject,
      description: formInput.description,
      requesterEmail: userEmail,
      category: formInput.category,
      priority: formInput.priority,
      status: 'Open'
    };
    
    // Submit to backend API
    const response = submitToBackend(ticketData);
    
    if (response.success) {
      // Send email to ICT
      sendEmailToICT(ticketData, response.ticket);
      
      // Show success card
      return createSuccessCard(response.ticket.ticketNumber);
    } else {
      return createErrorCard('Failed to submit ticket: ' + response.message);
    }
    
  } catch (error) {
    Logger.log('Error submitting ticket: ' + error);
    return createErrorCard('An error occurred: ' + error.message);
  }
}

/**
 * Submits ticket to backend API
 * @param {Object} ticketData The ticket data to submit
 * @return {Object} The API response
 */
function submitToBackend(ticketData) {
  try {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(ticketData),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(CONFIG.API_URL, options);
    const result = JSON.parse(response.getContentText());
    
    return result;
  } catch (error) {
    Logger.log('Backend API error: ' + error);
    return { success: false, message: error.message };
  }
}

/**
 * Sends email notification to ICT department
 * @param {Object} ticketData The ticket data
 * @param {Object} ticket The created ticket object
 */
function sendEmailToICT(ticketData, ticket) {
  try {
    const subject = '[New Ticket] ' + ticketData.subject;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background: linear-gradient(135deg, #911414 0%, #d20001 100%); padding: 20px; color: white;">
          <h2>New IT Support Ticket</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb;">
          <h3>Ticket Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Ticket Number:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${ticket.ticketNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>From:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${ticketData.requesterEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Category:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${ticketData.category}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Priority:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${ticketData.priority}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Subject:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${ticketData.subject}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background-color: white; border-left: 4px solid #911414;">
            <h4 style="margin-top: 0;">Description:</h4>
            <p style="white-space: pre-wrap;">${ticketData.description}</p>
          </div>
          
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            View and manage this ticket in the IT Ticketing System dashboard.
          </p>
        </div>
        
        <div style="background-color: #911414; padding: 15px; text-align: center; color: white;">
          <p style="margin: 0; font-size: 12px;">© KUCCPS IT Department</p>
        </div>
      </div>
    `;
    
    GmailApp.sendEmail(CONFIG.ICT_EMAIL, subject, '', {
      htmlBody: htmlBody,
      name: 'KUCCPS IT Support System'
    });
    
  } catch (error) {
    Logger.log('Error sending email to ICT: ' + error);
  }
}

/**
 * Creates a success card
 * @param {string} ticketNumber The ticket number
 * @return {CardService.ActionResponse} The action response
 */
function createSuccessCard(ticketNumber) {
  const card = CardService.newCardBuilder();
  
  const header = CardService.newCardHeader()
    .setTitle('Ticket Submitted Successfully! ✓')
    .setImageUrl('https://www.kuccps.net/wp-content/uploads/2019/11/kuccps-logo.png')
    .setImageStyle(CardService.ImageStyle.SQUARE);
  
  card.setHeader(header);
  
  const section = CardService.newCardSection();
  
  section.addWidget(
    CardService.newTextParagraph()
      .setText('<b>Your ticket has been submitted to the IT department.</b>')
  );
  
  section.addWidget(
    CardService.newTextParagraph()
      .setText('<font color="#911414"><b>Ticket Number: ' + ticketNumber + '</b></font>')
  );
  
  section.addWidget(CardService.newDivider());
  
  section.addWidget(
    CardService.newTextParagraph()
      .setText('You will receive an email confirmation shortly. Our IT team will review your ticket and respond as soon as possible.')
  );
  
  section.addWidget(CardService.newDivider());
  
  // Create another ticket button
  const newTicketButton = CardService.newTextButton()
    .setText('Submit Another Ticket')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('onHomepage'))
    .setTextButtonStyle(CardService.TextButtonStyle.TEXT);
  
  section.addWidget(
    CardService.newButtonSet()
      .addButton(newTicketButton)
  );
  
  card.addSection(section);
  
  const navigation = CardService.newNavigation()
    .updateCard(card.build());
  
  return CardService.newActionResponseBuilder()
    .setNavigation(navigation)
    .build();
}

/**
 * Creates an error card
 * @param {string} errorMessage The error message to display
 * @return {CardService.ActionResponse} The action response
 */
function createErrorCard(errorMessage) {
  const card = CardService.newCardBuilder();
  
  const header = CardService.newCardHeader()
    .setTitle('Error')
    .setImageUrl('https://www.kuccps.net/wp-content/uploads/2019/11/kuccps-logo.png')
    .setImageStyle(CardService.ImageStyle.SQUARE);
  
  card.setHeader(header);
  
  const section = CardService.newCardSection();
  
  section.addWidget(
    CardService.newTextParagraph()
      .setText('<font color="#dc2626"><b>⚠ ' + errorMessage + '</b></font>')
  );
  
  section.addWidget(CardService.newDivider());
  
  section.addWidget(
    CardService.newTextParagraph()
      .setText('Please try again or contact the IT department directly at ' + CONFIG.ICT_EMAIL)
  );
  
  // Try again button
  const tryAgainButton = CardService.newTextButton()
    .setText('Try Again')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('onHomepage'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#911414');
  
  section.addWidget(
    CardService.newButtonSet()
      .addButton(tryAgainButton)
  );
  
  card.addSection(section);
  
  const navigation = CardService.newNavigation()
    .updateCard(card.build());
  
  return CardService.newActionResponseBuilder()
    .setNavigation(navigation)
    .build();
}
