import { screen } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { localStorageMock } from "../__mocks__/localStorage"
import { ROUTES } from "../constants/routes"
import firebase from "../__mocks__/firebase"
import userEvent from '@testing-library/user-event'

describe("Given I am connected as an employee", () => {
    let onNavigate;
    let container;
    let firestore = null

    beforeEach(() => {
      onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      const user = JSON.stringify({
        type: 'Employee'
      })
      window.localStorage.setItem('user', user)
      document.body.innerHTML = BillsUI({ data: bills });
      container = new Bills({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      })
    })
  
  describe("When I navigate to Bill Page", () => {
    test("fetches bills from mock API GET", async () => {
        const getSpy = jest.spyOn(firebase, "get")
        const bills = await firebase.get()
        expect(getSpy).toHaveBeenCalledTimes(1)
        expect(bills.data.length).toBe(4)
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

  describe("When I am on Bills Page", () => {
    //check with Tutor
    test("Then bill icon in vertical layout should be highlighted", () => {
      // expect(screen.getByTestId("icon-window").classList.contains("active-icon")).toBeTruthy();
    })

    test("if there are no bills, the table should be empty", () => {
      const html = BillsUI({ data: []})
      document.body.innerHTML = html
      const iconEye = screen.queryByTestId("icon-eye");
      expect(iconEye).toBeNull()
    })

    test("Then bills should be ordered from earliest to latest", () => {
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("if Bill data is available, will show on table", () => {
      const html = BillsUI({ data: bills})
      document.body.innerHTML = html
      const iconEye = screen.queryAllByTestId("icon-eye");
      expect(iconEye).toBeTruthy();
      expect(iconEye.length).toBe(4);
      expect(screen.getAllByText("pending")).toBeTruthy();
    })
  })

  describe("When I click on the NewBill button", () => {
    test("Then the new bill page should be shown", () => {
      const newBillBtn = screen.getByTestId("btn-new-bill");
      const clickNewBill = jest.fn(container.handleClickNewBill);
      newBillBtn.addEventListener("click", clickNewBill);
      userEvent.click(newBillBtn);

      expect(clickNewBill).toHaveBeenCalled();
      expect(screen.getAllByText("Send a fee")).toBeTruthy();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      //check with tutor
      // expect(screen.getByTestId("icon-mail").classList.contains("active-icon")).toBeTruthy();
    })
  })

  describe("When I click on the eye icon", () => {
    test("A modal should open with bill information", () => {
      $.fn.modal = jest.fn();
      const iconEyeBtn = screen.getAllByTestId("icon-eye")[0];
      const modalTrigger = jest.fn(container.handleClickIconEye);
      iconEyeBtn.addEventListener("click", () => {modalTrigger(iconEyeBtn);});
      userEvent.click(iconEyeBtn);

      expect(modalTrigger).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalledWith("show");
      
      const modal = document.getElementById('modaleFile')
      expect(modal).toBeTruthy();

      const modalTitle = screen.getByText("Fee");
      expect(modalTitle).toBeTruthy();

      const modalImageUrl = iconEyeBtn.getAttribute("data-bill-url").split("?")[0];
      expect(modal.innerHTML.includes(modalImageUrl)).toBeTruthy();
    })
  })

  describe('When I am on Bills page but it is loading', () => {
    test('Then, Loading page should be rendered', () => {
      const html = BillsUI({ loading: true })
      document.body.innerHTML = html
      expect(screen.getAllByText('Loading...')).toBeTruthy()
    })
  })

  describe('When I am on Bills page but back-end send an error message', () => {
    test('Then, Error page should be rendered', () => {
      const html = BillsUI({ error: 'some error message' })
      document.body.innerHTML = html
      expect(screen.getAllByText('Erreur')).toBeTruthy()
    })
  })
})
