/*
 * @Description:
 * @Author: kay
 * @Date: 2021-06-16 15:56:25
 * @LastEditTime: 2021-09-18 10:41:22
 * @LastEditors: kay
 */

#undef NDEBUG
#include <platon/platon.hpp>
using namespace platon;

namespace dante {

static constexpr int64_t kMsecondsPerDay = 24 * 3600 * 1000ll;

// call other contract proposal
struct GeneralProposal {
  int64_t expiration;
  Address contract_addr;
  bytes paras;
  std::set<std::string> approvers;

  PLATON_SERIALIZE(GeneralProposal,
                   (expiration)(contract_addr)(paras)(approvers))
};

// transfer LAT proposa;
struct TransferProposal {
  int64_t expiration;
  Address to;
  u128 amount;
  std::set<std::string> approvers;

  PLATON_SERIALIZE(TransferProposal, (expiration)(to)(amount)(approvers))
};

// update managers proposal
struct UpdateManagersProposal {
  uint8_t requires;
  int64_t expiration;
  std::set<std::string> managers;
  std::set<std::string> approvers;

  PLATON_SERIALIZE(UpdateManagersProposal,
                   (requires)(expiration)(managers)(approvers))
};

struct Proposal {
  GeneralProposal general_proposal;
  TransferProposal transfer_proposal;
  UpdateManagersProposal update_managers_proposal;

  PLATON_SERIALIZE(
      Proposal,
      (general_proposal)(transfer_proposal)(update_managers_proposal))
};

struct Managers {
  std::set<std::string> managers;
  uint8_t requires;

  PLATON_SERIALIZE(Managers, (managers)(requires))
};

CONTRACT multisig : public platon::Contract {
 public:
  ACTION void init(const std::set<std::string>& managers,
                   const uint8_t& requires);
  CONST std::set<std::string> get_managers();
  CONST Address get_owner();
  CONST uint8_t get_requires();
  CONST Proposal get_proposal(const std::string& proposal_name);

  /**
   * Propose action. Propose a proposal of calling other contract.
   *
   * @param proposal_name - proposal name.
   * @param contract_addr - call other contract's address.
   * @param paras - the encoded ABI byte code to send via a transaction or call.
   * @param expiration - after `expiration(ms)` this proposal will be unvalid,
   * if `expiration <= 0` default one day.
   */
  ACTION bool propose(const std::string& proposal_name,
                      const Address& contract_addr, const bytes& paras,
                      const int64_t& expiration);

  /**
   * Propose transfer LAT action. Propose a proposal of transfer LAT to ${to}.
   *
   * @param proposal_name - proposal name.
   * @param to - receipt address.
   * @param amount - transfer amount.
   * @param expiration - after `expiration(ms)` this proposal will be unvalid,
   * if `expiration <= 0` default one day.
   */
  ACTION bool propose_transfer(const std::string& proposal_name,
                               const Address& to, const u128& amount,
                               const int64_t& expiration);

  /**
   * Propose update(add or remove) managers action. Propose a proposal of
   * updating managers
   *
   * @param proposal_name - proposal name.
   * @param new_managers - new multisig contract managers list.
   * @param new_requires - new minimum requires.
   * @param expiration - after `expiration(ms)` this proposal will be unvalid,
   * if `expiration <= 0` default one day.
   */
  ACTION bool propose_update_managers(const std::string& proposal_name,
                                      const std::set<std::string>& new_managers,
                                      const uint8_t& new_requires,
                                      const int64_t& expiration);

  /**
   * Approve action. Approve proposal and only managers can execute.
   *
   * @param proposal_name - proposal name.
   */
  ACTION bool approve(const std::string& proposal_name);

  /**
   * Execute action. Execute proposal, only approvers more then "requires"
   * then it can be execute.
   *
   * @param proposal_name - proposal name.
   */
  ACTION bool execute(const std::string& proposal_name);

  static inline int64_t get_expiration_time(const int64_t& expiration) {
    return expiration <= 0 ? platon_timestamp() + kMsecondsPerDay
                           : platon_timestamp() + expiration;
  }

  inline bool proposal_exists(const std::string& proposal_name) {
    return general_proposals.contains(proposal_name) ||
           transfer_proposals.contains(proposal_name) ||
           update_managers_proposals.contains(proposal_name);
  }

  inline void require_manager() {
    Address sender = platon_caller();
    auto managers = manager_table.self().managers;
    platon_assert(managers.find(sender.toString()) != managers.end(),
                  "multisig: require manager");
  }

  static inline auto platon_call(const Address& contract_addr,
                                 const bytes& paras) {
    bool result =
        platon::platon_call(contract_addr, paras, uint32_t(0), uint32_t(0));
    if (!result) {
      return std::pair<bool, bool>(false, false);
    }
    bool return_value;
    get_call_output(return_value);
    return std::pair<bool, bool>(return_value, true);
  }

 protected:
  PLATON_EVENT2(Propose, Address, std::string, Address, bytes, int64_t);
  PLATON_EVENT2(ProposeTransfer, Address, std::string, Address, u128, int64_t);
  PLATON_EVENT2(ProposeUpdateManagers, Address, std::string,
                std::set<std::string>, uint8_t, int64_t);
  PLATON_EVENT1(Approve, Address, std::string);
  PLATON_EVENT1(Execute, Address, std::string);

 private:
  platon::db::Map<"propsals"_n, std::string, GeneralProposal> general_proposals;
  platon::db::Map<"transfers"_n, std::string, TransferProposal>
      transfer_proposals;
  platon::db::Map<"update"_n, std::string, UpdateManagersProposal>
      update_managers_proposals;
  platon::StorageType<"managers"_n, Managers> manager_table;
};

PLATON_DISPATCH(
    multisig,
    (init)(propose)(propose_transfer)(propose_update_managers)(approve)(
        execute)(get_managers)(get_owner)(get_requires)(get_proposal))

}  // namespace dante