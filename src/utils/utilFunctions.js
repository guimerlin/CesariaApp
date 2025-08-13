      // CALCULAR A DATA DO CONVENIO
      const calculateDate = (limitDate) => {
        const diaFormatado = String(limitDate).padStart(2, '0');
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth() + 1;
        const diaAtual = hoje.getDate();

        if (diaAtual >= limitDate) {
          const mesFormatado = String(mesAtual).padStart(2, '0');
          return `${anoAtual}-${mesFormatado}-${diaFormatado}`;
        } else {
          let anoInicio = anoAtual;
          let mesInicio = mesAtual - 1;
          if (mesInicio < 1) {
            mesInicio = 12;
            anoInicio -= 1;
          }
          const mesFormatado = String(mesInicio).padStart(2, '0');
          return `${anoInicio}-${mesFormatado}-${diaFormatado}`;
      }}

      export default calculateDate;