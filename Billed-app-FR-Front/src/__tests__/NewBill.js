/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/Store';
import { ROUTES_PATH, ROUTES } from '../constants/routes.js';
import router from '../app/Router.js';

jest.mock('../app/Store.js', () => mockStore);

describe('Given I am connected as an employee', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
      })
    );
    const root = document.createElement('div');
    root.setAttribute('id', 'root');
    document.body.append(root);
    document.querySelector('#root').innerHTML = NewBillUI();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('When I am on NewBill Page', () => {
    test('Then the form is displayed', () => {
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      expect(screen.getByTestId('form-new-bill')).toBeTruthy();
    });

    test('Then bill icon in vertical layout should be highlighted', async () => {
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      const mailIcon = screen.getByTestId('icon-mail');
      //to-do write expect expression
      expect(mailIcon).toHaveClass('active-icon');
    });
  });

  describe('When I upload a file with a valid extension', () => {
    test('Then a request should be created', async () => {
      const onNavigate = (pathname) => {
        document.querySelector('#root').innerHTML = ROUTES({ pathname });
      };

      const manageBillForm = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      await waitFor(() => screen.getByTestId('file'));
      const inputFile = screen.getByTestId('file');

      const file = new File(['(⌐□_□)'], 'chucknorris.jpg', {
        type: 'image/jpg',
      });

      const filePath = 'C:\\fakepath\\chucknorris.jpg';

      Object.defineProperty(inputFile, 'value', {
        value: filePath,
        writable: false,
      });

      await userEvent.upload(inputFile, file);

      expect(manageBillForm.billId).toBe('1234');
      expect(manageBillForm.fileUrl).toBe(
        'https://localhost:3456/images/test.jpg'
      );
      expect(manageBillForm.fileName).toBe(file.name);
    });
  });

  describe('When I upload a file with an invalid extension', () => {
    test('Then an error should be displayed', async () => {
      const onNavigate = (pathname) => {
        document.querySelector('#root').innerHTML = ROUTES({ pathname });
      };

      const manageBillForm = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      await waitFor(() => screen.getByTestId('file'));
      const inputFile = screen.getByTestId('file');

      const file = new File(['(⌐□_□)'], 'chucknorris.gif', {
        type: 'image/gif',
      });

      const filePath = 'C:\\fakepath\\chucknorris.gif';

      Object.defineProperty(inputFile, 'value', {
        value: filePath,
        writable: true,
      });

      await userEvent.upload(inputFile, file);

      expect(inputFile.validationMessage).toBe(
        'Uniquement des fichiers jpg, jpeg et png'
      );
    });
  });

  describe('when form is submited with all input completed', () => {
    test('POST Bill to mock API and the bills page is displayed', async () => {
      const onNavigate = (pathname) => {
        document.querySelector('#root').innerHTML = ROUTES({ pathname });
      };

      const updateMock = jest.fn().mockResolvedValue();

      const storeUpdateMock = jest.spyOn(mockStore.bills(), 'update');
      storeUpdateMock.mockImplementation(updateMock);

      const manageBillForm = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      await waitFor(() => screen.getByTestId('file'));
      const inputFile = screen.getByTestId('file');

      const file = new File(['(⌐□_□)'], 'chucknorris.png', {
        type: 'image/png',
      });

      const filePath = 'C:\\fakepath\\chucknorris.png';

      Object.defineProperty(inputFile, 'value', {
        value: filePath,
        writable: false,
      });

      await userEvent.upload(inputFile, file);

      const name = screen.getByTestId('expense-name');
      const date = screen.getByTestId('datepicker');
      const amount = screen.getByTestId('amount');
      const vat = screen.getByTestId('vat');
      const pct = screen.getByTestId('pct');
      const commentary = screen.getByTestId('commentary');
      const submitButton = screen.getByText('Envoyer');

      const defaultSelect = screen.getByTestId('expense-type').value;
      const bill = {
        type: defaultSelect,
        name: 'encore',
        amount: 400,
        date: '2004-04-04',
        vat: '80',
        pct: 25,
        commentary: 'séminaire billed',
        fileUrl: manageBillForm.fileUrl,
        fileName: manageBillForm.fileName,
        status: 'pending',
      };

      console.log(defaultSelect);
      name.value = bill.name;
      date.value = bill.date;
      amount.value = bill.amount;
      vat.value = bill.vat;
      pct.value = bill.pct;
      commentary.value = bill.commentary;

      const expectedBill = {
        data: JSON.stringify(bill),
        selector: manageBillForm.billId,
      };

      await fireEvent.click(submitButton);

      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledWith(expectedBill);
      expect(screen.getByTestId('btn-new-bill')).toBeTruthy();
    });
  });

  describe('When the form is submitted with incomplete input', () => {
    test('then the submit function is not called', async () => {
      const onNavigate = (pathname) => {
        document.querySelector('#root').innerHTML = ROUTES({ pathname });
      };

      const manageBillForm = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      const spyOnSubmit = jest.spyOn(manageBillForm, 'handleSubmit').mockImplementation(() => {})

      await waitFor(() => screen.getByTestId('file'));
      const expenseNameInput = screen.getByTestId('expense-name');
      const submitButton = screen.getByText('Envoyer');

      expenseNameInput.value = ''

      await fireEvent.click(submitButton)

      expect(spyOnSubmit).not.toHaveBeenCalled()
    })
  })
});
