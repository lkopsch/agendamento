document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  var today = new Date();
  today.setHours(0, 0, 0, 0); // Define a hora para 00:00:00 para comparar apenas a data

  var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 700,
      locale: 'pt-br',
      validRange: {
          start: today // Data de início a partir de hoje
      },

      dayCellDidMount: function(info) {
          var cellDate = new Date(info.date);
          cellDate.setHours(0, 0, 0, 0);
          var data = info.date.toISOString().split('T')[0];

          if (cellDate < today) {
              info.el.style.backgroundColor = '#ccc'; // Cor de fundo cinza para "agenda fechada"
              info.el.style.pointerEvents = 'none'; // Impede cliques
              info.el.innerHTML = ''; // Limpa o conteúdo anterior
              var statusDiv = document.createElement('div');
              statusDiv.innerText = 'Agenda Fechada';
              statusDiv.classList.add('status-message');
              info.el.appendChild(statusDiv);
              return;
          }

          fetch(`/verificar_vagas/${data}/`)
              .then(response => response.json())
              .then(data => {
                  var vagasDisponiveis = data.vagas_disponiveis;

                  // Define a cor de fundo baseada na disponibilidade
                  info.el.style.backgroundColor = vagasDisponiveis ? 'green' : 'red';
                  info.el.setAttribute('data-vagas', vagasDisponiveis);

                  // Limpa o conteúdo anterior do elemento
                  info.el.innerHTML = '';

                  // Cria um div para mostrar a mensagem dentro do calendário
                  var statusDiv = document.createElement('div');
                  statusDiv.innerText = vagasDisponiveis ? 'Há vagas' : 'Não há vagas';
                  statusDiv.classList.add('status-message'); // Adiciona uma classe para estilizar
                  info.el.appendChild(statusDiv);
              })
              .catch(error => {
                  console.error("Erro ao verificar vagas:", error);
              });
      },

      dateClick: function(info) {
          var vagasDisponiveis = info.dayEl.getAttribute('data-vagas') === 'true';

          if (!vagasDisponiveis) {
              alert("Não há vagas disponíveis neste dia.");
              return;
          }

          var selectedDate = info.dateStr;
          document.getElementById('selectedDate').innerText = selectedDate;

          var timeButtons = document.querySelectorAll('#timeButtons button');
          timeButtons.forEach(function(button) {
              button.classList.remove('disabled');
              button.setAttribute('data-date', selectedDate);
          });

          fetch(`/eventos-crus/?date=${selectedDate}`)
              .then(response => response.json())
              .then(data => {
                  if (data.length > 0) {
                      data.forEach(event => {
                          var formattedTime = event.start_time.substring(0, 5);
                          var buttonToDisable = document.querySelector(`button[data-time="${formattedTime}"]`);
                          if (buttonToDisable) {
                              buttonToDisable.classList.add('disabled');
                          }
                      });
                  }
              })
              .catch(error => {
                  console.error('Erro ao buscar eventos:', error);
              });

          var modal = new bootstrap.Modal(document.getElementById('dateModal'));
          modal.show();
      }
  });

  calendar.render();

  document.getElementById('btnMonthView').addEventListener('click', function() {
      calendar.changeView('dayGridMonth');
  });

  document.getElementById('btnWeekView').addEventListener('click', function() {
      calendar.changeView('timeGridWeek');
  });
});




// Adiciona o evento de clique aos botões de horário
document.querySelectorAll('#timeButtons button').forEach(function(button) {
  button.addEventListener('click', function() {
    // Coleta os dados do botão
    var date = this.getAttribute('data-date');
    var time = this.getAttribute('data-time');
    var eventTitle = 'Evento de ' + time + ' no dia ' + date;
  
    // Coleta os dados de nome e email do sessionStorage ou campos no DOM
    var name = sessionStorage.getItem('name') || document.getElementById('name').value;
    var email = sessionStorage.getItem('email') || document.getElementById('email').value;

    // Verifica se o nome e email estão presentes
    if (!name || !email) {
      alert('Nome e email são obrigatórios.');
      return;
    }

    // Cria um objeto com os dados do evento
    const newEvent = {
      title: eventTitle,
      start: `${date}T${time}:00`,
      allDay: false,
      name: name,
      email: email
    };

    // Envia o novo evento via POST para o Django
    fetch('/criar-evento/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')  // Token CSRF para segurança
      },
      body: JSON.stringify(newEvent)
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        alert('Evento adicionado com sucesso!');
        // Recarrega a página
        location.reload();
      } else {
         alert('Erro ao adicionar evento.');
      }
    })
    .catch(error => {
      console.error('Erro:', error);
    });
  });
});


// Função para obter o cookie CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Verifica se este cookie começa com o nome desejado
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}


