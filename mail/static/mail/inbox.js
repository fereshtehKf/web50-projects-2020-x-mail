document.addEventListener('DOMContentLoaded', function () {
    // Use buttons to toggle between views
    document.querySelectorAll('#inbox, #sent, #archived').forEach(button => {
        button.addEventListener('click', () => load_mailbox(button.id));
    });
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#compose-form').onsubmit = compose_submit;

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {
    document.querySelectorAll('#emails-view, #email-view').forEach(view => view.style.display = 'none');
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    ['#compose-recipients', '#compose-subject', '#compose-body'].forEach(field => {
        document.querySelector(field).value = '';
    });
}

function compose_submit() {
    const fields = ['recipients', 'subject', 'body'].reduce((acc, field) => {
        acc[field] = document.querySelector(`#compose-${field}`).value;
        return acc;
    }, {});

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify(fields)
    })
    .then(response => response.json())
    .then(() => load_mailbox('sent'));

    return false;
}

function load_mailbox(mailbox) {
    document.querySelectorAll('#compose-view, #email-view').forEach(view => view.style.display = 'none');
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            emails.forEach(email => {
                const elem_email = document.createElement('div');
                elem_email.classList.add('email', email.read ? 'is_read' : '');
                elem_email.innerHTML = `
                    <div>Subject: ${email.subject}</div>
                    <div>Sender: ${email.sender}</div>
                    <div>Date: ${email.timestamp}</div>
                `;
                elem_email.addEventListener('click', () => load_email(email.id, mailbox));
                document.querySelector('#emails-view').append(elem_email);
            });
        });
}

function load_email(id, mailbox) {
    const isSentMailbox = mailbox === "sent";

    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true })
    });

    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
            document.querySelector('#email-view').innerHTML = `
                <div>From: ${email.sender}</div>
                <div>To: ${email.recipients}</div>
                <div>Subject: ${email.subject}</div>
                <div>Timestamp: ${email.timestamp}</div>
                <div class="email-buttons">
                    <button class="btn-email" id="reply">Reply</button>
                    <button class="btn-email" id="archive">${email.archived ? "Unarchive" : "Archive"}</button>
                </div>
                <hr>
                <div>${email.body}</div>
            `;

            if (isSentMailbox) document.querySelector('.email-buttons').style.display = 'none';

            document.querySelector('#archive').addEventListener('click', () => {
                fetch(`/emails/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ archived: !email.archived })
                }).then(() => load_mailbox('inbox'));
            });

            document.querySelector('#reply').addEventListener('click', () => {
                compose_email();
                document.querySelector('#compose-recipients').value = email.sender;
                document.querySelector('#compose-subject').value = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
                document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n\n`;
            });

            document.querySelector('#email-view').style.display = 'block';
            document.querySelector('#emails-view').style.display = 'none';
        });
}