var app = new Vue({
  el: '#main',
  data: {
    profesores: [],
    nombres: '',
    apell_pat: ''
  },
  created: function () {
    this.obtenerProfesores();
  },
  methods: {
    obtenerProfesores: function () {
      var urlUsers = 'https://fisitcsld.herokuapp.com/api/teachers';
      axios.get(urlUsers).then(response => {
        this.profesores = response.data
      });
    }
  },
  computed: {
    buscarDocente: function () {
      var result = this.profesores.filter((item) => item.nombres.toLowerCase().includes(this.nombres.toLowerCase()));
      result = result.filter((item) => item.apell_pat.toLowerCase().includes(this.apell_pat.toLowerCase()))
      return result
    }
  }
});